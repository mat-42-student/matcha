import { Server } from "socket.io";
import { Payload } from "@/lib/types";
import { send } from "./socket";
import { storeMessage, getOnlineMatchedUsers } from "../db/chat";

export function handleNotif(payload: Payload, io: Server) {
  send(payload.to.id, "notif", payload, io); // send to recipient
}
