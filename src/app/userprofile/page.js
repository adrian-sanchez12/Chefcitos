import React from "react";
import { Avatar } from "primereact/avatar";
import { Button } from "primereact/button";
import { Chip } from "primereact/chip";
import { Card } from "primereact/card";
import { Image } from "primereact/image";
import { Divider } from "primereact/divider";

const UserProfile = () => {
  const profile = {
    username: "jordan",
    posts: 1048,
    followers: "13.5k",
    following: 22,
    bio: "Graphic designer and photographer",
    website: "www.defectsdesigns.com",
    avatar: "https://source.unsplash.com/100x100/?camera",
    highlights: [
      { title: "Landscape", img: "https://source.unsplash.com/50x50/?forest" },
      { title: "Cali", img: "https://source.unsplash.com/50x50/?beach" },
      { title: "City", img: "https://source.unsplash.com/50x50/?city" },
      { title: "Plants", img: "https://source.unsplash.com/50x50/?plant" },
      { title: "Portraits", img: "https://source.unsplash.com/50x50/?portrait" },
      { title: "NYC", img: "https://source.unsplash.com/50x50/?nyc" },
    ],
    postsGallery: [
      "https://source.unsplash.com/300x300/?fashion",
      "https://source.unsplash.com/300x300/?nature",
      "https://source.unsplash.com/300x300/?street",
      "https://source.unsplash.com/300x300/?model",
      "https://source.unsplash.com/300x300/?architecture",
      "https://source.unsplash.com/300x300/?travel",
    ],
  };

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-5">
        <Avatar image={profile.avatar} size="xlarge" shape="circle" />
        <div>
          <h2 className="text-2xl font-semibold">{profile.username}</h2>
          <div className="flex gap-3 mt-1">
            <span>{profile.posts} posts</span>
            <span>{profile.followers} followers</span>
            <span>{profile.following} following</span>
          </div>
          <div className="mt-2">
            <strong>{profile.bio}</strong>
            <p className="text-sm text-blue-500 cursor-pointer">{profile.website}</p>
          </div>
          <Button label="Follow" icon="pi pi-user-plus" className="p-button-outlined mt-3" />
        </div>
      </div>

      <Divider />

      <div className="flex gap-3 overflow-x-auto">
        {profile.highlights.map((highlight, index) => (
          <Chip key={index} label={highlight.title} image={highlight.img} className="cursor-pointer" />
        ))}
      </div>

      <Divider />

      <div className="grid grid-cols-3 gap-3">
        {profile.postsGallery.map((post, index) => (
          <Card key={index} className="shadow-none p-0 border-0">
            <Image src={post} alt="Post" className="w-full rounded-md" preview />
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserProfile;
