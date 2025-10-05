"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Edit2 } from "lucide-react";
import { ProfilePicturesModal } from "./ProfilePicturesModal";

export default function ProfilePicture({ userId }: { userId: string }) {
	const [mainPic, setMainPic] = useState<string | null>(null);
	const [isHovered, setIsHovered] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);

	useEffect(() => {
		async function fetchMainPic() {
			const res = await fetch(`/api/users/${userId}/pics`);
			if (res.ok) {
				const data = await res.json();
				setMainPic(`data:${data.mime_type};base64,${data.data}`);
			}
		}
		fetchMainPic();
	}, [userId]);

	return (
		<div className="relative w-48 h-48 mx-auto mt-6">
			<Image
				src={mainPic || "/default-avatar.png"}
				alt="Photo de profil"
				fill
				className="object-cover rounded-full border-4 border-pink-300 shadow-lg cursor-pointer transition"
				onClick={() => setIsModalOpen(true)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			/>

			{isHovered && (
				<button
					onClick={() => setIsModalOpen(true)}
					className="absolute bottom-2 right-2 bg-pink-600 text-white rounded-full p-2 shadow-lg hover:bg-pink-700 transition"
				>
					<Edit2 size={18} />
				</button>
			)}

			{isModalOpen && (
				<ProfilePicturesModal userId={userId} onClose={() => setIsModalOpen(false)} />
			)}
		</div>
	);
}