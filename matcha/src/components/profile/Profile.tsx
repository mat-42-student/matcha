import CardUser from '@/components/card-user/CardUser'
import { PublicUser } from '@/types'

export default function Profile({user}:{user: PublicUser}) {

  return (
      <div>
          <CardUser user={user}/>
      </div>
  )
}