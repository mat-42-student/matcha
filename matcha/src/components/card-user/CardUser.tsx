import { User } from "@/lib/db/users"
import MainPic from "@/components/pics/MainPic"

export default function CardUser({user} : {user: User}) {
  const { id, username, city, bio } = user;
  const shortbio = bio?.slice(0, 100)  || "No bio yet";

  return (
    <div className="w-72 bg-white border border-gray-300 rounded-lg shadow-md p-4 m-4 inline-block">
      <span className="text-xl text-pink-700 font-semibold mb-2">{username}</span>
      <MainPic userId={id}/>
      <span className="text-gray-800 mb-2 text-right">{city || "Unknown city"}</span>
      <p className="text-gray-600 mb-4">{shortbio}</p>
      <button className="bg-pink-500 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition">
        Like
      </button>
    </div>
  )
}
