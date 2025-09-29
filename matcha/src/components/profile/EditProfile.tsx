import { PublicUser } from "@/types"

export default function EditProfile({user}:{user: PublicUser}) {
    return (
        <div>
            Edit {user.username} profile here
        </div>
    )
}