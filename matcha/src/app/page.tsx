// "use client";
import Browse from "@/components/browse/Browse";
import Geoloc from "@/components/geoloc/Geoloc"

export default function Homepage() {
  return (
    <>
      <Browse />
      <Geoloc userId="987f4997-9d56-482b-ba8e-68651cff86d9" />
    </>
  )
}