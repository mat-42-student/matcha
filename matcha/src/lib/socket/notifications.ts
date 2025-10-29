import { Server } from "socket.io";
import { Payload } from "@/lib/types";
import { send } from "./socket";

export function handleNotif(payload: Payload) {
  send(payload.to.id, "notif", payload); // send to recipient
}
