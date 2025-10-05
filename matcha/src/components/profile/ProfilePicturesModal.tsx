"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Star, Trash2, Upload } from "lucide-react";

export function ProfilePicturesModal({ userId, onClose }: { userId: string; onClose: () => void }) {
	const [pictures, setPictures] = useState<any[]>([]);

	useEffect(() => {
		async function fetchPics() {
			const res = await fetch(`/api/users/${userId}/allpics`);
			if (res.ok) {
				const data = await res.json();
				setPictures(data);
			}
		}
		fetchPics();
	}, [userId]);

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files?.length) return;
		const file = e.target.files[0];

		const formData = new FormData();
		formData.append("file", file);

		await fetch(`/api/users/${userId}/upload`, {
			method: "POST",
			body: formData,
		});

		location.reload();
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
			<div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg relative">
				<button
					onClick={onClose}
					className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
				>
					<X size={20} />
				</button>

				<h2 className="text-xl font-semibold text-gray-900 mb-4">Modifier mes photos</h2>

				<div className="grid grid-cols-3 gap-4">
					{pictures.map((pic) => (
						<div key={pic.id} className="relative group">
							<Image
								src={`data:${pic.mime_type};base64,${pic.data}`}
								alt="photo"
								width={100}
								height={100}
								className="object-cover w-full h-32 rounded-lg border shadow-sm"
							/>
							<div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
								<button className="bg-white p-1 rounded-full hover:bg-pink-200">
									<Star className="text-yellow-400" size={18} />
								</button>
								<button className="bg-white p-1 rounded-full hover:bg-pink-200">
									<Trash2 className="text-red-500" size={18} />
								</button>
							</div>
						</div>
					))}

					{/* Bouton d’upload */}
					<label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg h-32 cursor-pointer hover:bg-gray-50">
						<Upload className="text-gray-400 mb-2" />
						<span className="text-gray-500 text-sm">Ajouter une photo</span>
						<input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
					</label>
				</div>
			</div>
		</div>
	);
}