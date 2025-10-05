// "use client";

// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent } from "@/components/ui/cards";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { useState } from "react";

// export default function ProfileTabs({ user, editable = false }) {
// 	const [form, setForm] = useState({
// 		username: user.username || "",
// 		email: user.email || "",
// 		bio: user.bio || "",
// 		sex_pref: user.sex_pref || "B",
// 	});

// 	function handleChange(e) {
// 		setForm({ ...form, [e.target.name]: e.target.value });
// 	}

// 	function handleSubmit(e) {
// 		e.preventDefault();
// 		// 🔥 appel API update profile
// 		console.log("Saving profile:", form);
// 	}

// 	return (
// 		<Tabs defaultValue="infos" className="w-full max-w-3xl">
// 			<TabsList className="grid grid-cols-3">
// 				<TabsTrigger value="infos">Infos</TabsTrigger>
// 				<TabsTrigger value="photos">Photos</TabsTrigger>
// 				<TabsTrigger value="interests">Intérêts</TabsTrigger>
// 			</TabsList>

// 			{/* --- Onglet infos --- */}
// 			<TabsContent value="infos">
// 				<Card>
// 					<CardContent className="p-6">
// 						{editable ? (
// 							<form onSubmit={handleSubmit} className="flex flex-col gap-4">
// 								<Input
// 									name="username"
// 									value={form.username}
// 									onChange={handleChange}
// 									placeholder="Nom d’utilisateur"
// 								/>
// 								<Input
// 									type="email"
// 									name="email"
// 									value={form.email}
// 									onChange={handleChange}
// 									placeholder="Email"
// 								/>
// 								<Textarea
// 									name="bio"
// 									value={form.bio}
// 									onChange={handleChange}
// 									placeholder="Bio"
// 								/>
// 								<Button type="submit">Enregistrer</Button>
// 							</form>
// 						) : (
// 							<div>
// 								<h2 className="text-xl font-semibold">{user.username}</h2>
// 								<p className="text-gray-500">{user.email}</p>
// 								<p className="mt-2">{user.bio || "Pas encore de bio"}</p>
// 							</div>
// 						)}
// 					</CardContent>
// 				</Card>
// 			</TabsContent>

// 			{/* --- Onglet photos --- */}
// 			<TabsContent value="photos">
// 				<Card>
// 					<CardContent className="p-6">
// 						<p>Ici tu pourras gérer tes photos (upload, définir photo principale…)</p>
// 					</CardContent>
// 				</Card>
// 			</TabsContent>

// 			{/* --- Onglet intérêts --- */}
// 			<TabsContent value="interests">
// 				<Card>
// 					<CardContent className="p-6">
// 						<div className="flex flex-wrap gap-2">
// 							{user.interests?.map((interest) => (
// 								<span
// 									key={interest}
// 									className="bg-pink-200 text-pink-800 px-3 py-1 rounded-full text-sm"
// 								>
// 									{interest}
// 								</span>
// 							))}
// 						</div>
// 						{editable && <Button className="mt-4">Modifier mes intérêts</Button>}
// 					</CardContent>
// 				</Card>
// 			</TabsContent>
// 		</Tabs>
// 	);
// }