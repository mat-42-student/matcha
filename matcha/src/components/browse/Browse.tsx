import { User, listUsers } from "@/lib/db/users"
import CardUser from "@/components/card-user/CardUser"

export async function Browse() {
  const users: User[] = await listUsers();
  // console.log(users[0]);
  const tmp_user = users[0]
  return(
    <>
      {/* {users.map((user) => (
        <CardUser key={user.id} user={user} />
      ))} */}
    <CardUser user={tmp_user} />
    </>
  )
}