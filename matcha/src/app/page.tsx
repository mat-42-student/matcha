// "use client";
import Browse from "@/components/browse/Browse";
import Geoloc from "@/components/geoloc/Geoloc"

export default function Homepage() {
  return (
    <>
      <Browse />
      <Geoloc userId="123456"/>
    </>
  )
}