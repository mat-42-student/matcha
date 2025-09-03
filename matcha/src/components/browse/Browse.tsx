import { User, listUsers } from "@/lib/db/users"
import CardUser from "@/components/card-user/CardUser"
import Pagination from "@/components/browse/Pagination"

export async function Browse() {
  const users: User[] = await listUsers();
  // console.log(users[0]);
  const tmp_user = users[0]
  return(
    <>
      <h1 className="text-3xl font-bold mb-6 text-center text-pink-800">Last Profiles</h1>
      {/* {users.map((user) => (
        <CardUser key={user.id} user={user} />
      ))} */}
    <CardUser user={tmp_user} />
    <Pagination />
    </>
  )
}