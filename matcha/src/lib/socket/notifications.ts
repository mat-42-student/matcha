import { Server } from "socket.io";
import { Payload } from "@/lib/types";
import { send } from "./socket";

export function handleNotif(sender: Payload["from"], payload: Payload) {
  send(payload.to.id, "notif", {
    ...payload,
    from: sender,
  });
}
