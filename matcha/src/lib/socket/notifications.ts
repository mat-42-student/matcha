import { Server } from "socket.io";
import { Payload, RelationChangedSocketEvent } from "@/lib/types";
import { send } from "./socket";

export function handleNotif(sender: Payload["from"], payload: Payload) {
  send(payload.to.id, "notif", {
    ...payload,
    from: sender,
  });
}

export function handleRelationChanged(senderId: string, payload: RelationChangedSocketEvent) {
  send(payload.toUserId, "relation-changed", {
    userId: senderId,
    likeStatus: payload.likeStatus,
  });
}
