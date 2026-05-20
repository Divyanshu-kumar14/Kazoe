import { useEffect, useRef, useCallback } from 'react';
import { requireSupabase } from '../lib/supabase';
import { useMultiplayerStore } from '../store/useMultiplayerStore';
import type { AnswerPayload, Match } from '../lib/multiplayer';
import type { RealtimeChannel } from '@supabase/supabase-js';

const FORFEIT_GRACE_SECONDS = 10;
const COUNTDOWN_SECONDS = 3;

export function useMultiplayerGame() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const dbChannelRef = useRef<RealtimeChannel | null>(null);
  const forfeitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const store = useMultiplayerStore;
  const userId = store((s) => s.userId);
  const matchId = store((s) => s.matchId);
  const matchStatus = store((s) => s.matchStatus);
  const playerNumber = store((s) => s.playerNumber);
  const timeRemaining = store((s) => s.timeRemaining);
  const forfeitTimer = store((s) => s.forfeitTimer);

  const startGame = store((s) => s.startGame);
  const submitAnswer = store((s) => s.submitAnswer);
  const receiveOpponentAnswer = store((s) => s.receiveOpponentAnswer);
  const endGame = store((s) => s.endGame);
  const setForfeitTimer = store((s) => s.setForfeitTimer);
  const setMatch = store((s) => s.setMatch);

  const myAnswers = store((s) => s.myAnswers);
  const opponentAnswers = store((s) => s.opponentAnswers);
  const scores = store((s) => s.scores);
  const currentQuestionIndex = store((s) => s.currentQuestionIndex);

  const forfeitCount = useRef(FORFEIT_GRACE_SECONDS);
  const matchStatusRef = useRef(matchStatus);
  matchStatusRef.current = matchStatus;

  useEffect(() => {
    if (!matchId || !userId) return;

    const channel = requireSupabase().channel(`match_room_${matchId}`, {
      config: { presence: { key: userId } },
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIds = Object.keys(state);
        const currentStatus = matchStatusRef.current;

        if (currentStatus === 'playing') {
          if (userIds.length < 2) {
            if (!forfeitIntervalRef.current) {
              forfeitCount.current = FORFEIT_GRACE_SECONDS;
              setForfeitTimer(forfeitCount.current);
              forfeitIntervalRef.current = setInterval(() => {
                forfeitCount.current -= 1;
                setForfeitTimer(forfeitCount.current);
                if (forfeitCount.current <= 0) {
                  if (forfeitIntervalRef.current) {
                    clearInterval(forfeitIntervalRef.current);
                    forfeitIntervalRef.current = null;
                  }
                  endGame();
                }
              }, 1000);
            }
          } else {
            if (forfeitIntervalRef.current) {
              clearInterval(forfeitIntervalRef.current);
              forfeitIntervalRef.current = null;
              setForfeitTimer(null);
            }
          }
        }
      })
      .on('broadcast', { event: 'answer_submitted' }, ({ payload }) => {
        const data = payload as AnswerPayload;
        if (data.playerId !== userId) {
          receiveOpponentAnswer(data);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId,
            playerNumber,
            onlineAt: Date.now(),
          });
        }
      });

    const dbChannel = requireSupabase()
      .channel(`match-db-${matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`,
      }, (payload) => {
        const updatedMatch = payload.new as unknown as Match;
        setMatch(updatedMatch);
      })
      .subscribe();

    dbChannelRef.current = dbChannel;

    return () => {
      [forfeitIntervalRef, timerIntervalRef].forEach((ref) => {
        if (ref.current) { clearInterval(ref.current); ref.current = null; }
      });
      [countdownTimeoutRef, graceTimeoutRef].forEach((ref) => {
        if (ref.current) { clearTimeout(ref.current); ref.current = null; }
      });
      if (dbChannelRef.current) {
        dbChannelRef.current.unsubscribe();
        dbChannelRef.current = null;
      }
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [matchId, userId]);

  useEffect(() => {
    if (matchStatus === 'countdown') {
      countdownTimeoutRef.current = setTimeout(() => {
        startGame();
      }, COUNTDOWN_SECONDS * 1000);
    }
    return () => {
      if (countdownTimeoutRef.current) {
        clearTimeout(countdownTimeoutRef.current);
        countdownTimeoutRef.current = null;
      }
    };
  }, [matchStatus]);

  useEffect(() => {
    if (matchStatus !== 'playing') return;

    if (graceTimeoutRef.current) {
      clearTimeout(graceTimeoutRef.current);
      graceTimeoutRef.current = null;
    }

    timerIntervalRef.current = setInterval(() => {
      const state = useMultiplayerStore.getState();
      const duration = state.match?.config?.timeLimitSeconds ?? 180;
      const elapsed = (performance.now() - state.gameStartTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);

      if (Math.round(remaining) !== Math.round(state.timeRemaining)) {
        useMultiplayerStore.setState({ timeRemaining: remaining });
      }

      if (remaining <= 0) {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        graceTimeoutRef.current = setTimeout(() => {
          endGame();
        }, 2000);
      }
    }, 250);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (graceTimeoutRef.current) {
        clearTimeout(graceTimeoutRef.current);
        graceTimeoutRef.current = null;
      }
    };
  }, [matchStatus]);

  const sendAnswer = useCallback((answer: number | null) => {
    const state = useMultiplayerStore.getState();
    if (state.matchStatus !== 'playing') return;

    const payload = submitAnswer(answer);
    if (!payload) return;

    const channel = channelRef.current;
    if (channel) {
      channel.send({ type: 'broadcast', event: 'answer_submitted', payload });
    }
  }, [submitAnswer]);

  return {
    sendAnswer,
    currentQuestionIndex,
    matchStatus,
    scores,
    playerNumber,
    myAnswers,
    opponentAnswers,
    timeRemaining,
    forfeitTimer,
  };
}
