"use client";

import { useEffect, useState } from "react";
import { subscribeToRoundQuestion } from "@/services/appwrite/realtime";
import { getRoomByCode } from "@/services/appwrite/rooms";

const POLL_MS = 5000;

/**
 * Live round question for a room: fetched once, kept fresh by realtime, with
 * polling as a fallback when the WebSocket subscription is unavailable.
 */
export function useRoundQuestion(roomId: string) {
  const [question, setQuestion] = useState("");

  useEffect(() => {
    if (!roomId) return;

    let cancelled = false;
    let receivedLive = false;
    let pollId: number | undefined;
    let unsubscribe: (() => void) | undefined;

    // A fetch that started before a realtime event must not overwrite it.
    const load = () => {
      const liveBefore = receivedLive;
      return getRoomByCode(roomId)
        .then((room) => {
          if (cancelled || !room) return;
          if (!liveBefore && receivedLive) return;
          setQuestion(room.roundQuestion ?? "");
        })
        .catch(() => {
          /* transient network; keep the last known question */
        });
    };

    void load();
    void subscribeToRoundQuestion(roomId, (next) => {
      if (cancelled) return;
      receivedLive = true;
      setQuestion(next);
    }).then((result) => {
      if (cancelled) {
        result.unsubscribe();
        return;
      }
      unsubscribe = result.unsubscribe;
      if (!result.connected) {
        pollId = window.setInterval(() => void load(), POLL_MS);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
      if (pollId !== undefined) window.clearInterval(pollId);
    };
  }, [roomId]);

  return { question: roomId ? question : "", setQuestion };
}
