import Chat from "./Chat";

export default async function Page({ params }: { params: { username: string } }) {
    return <Chat username={(await params).username} />
}