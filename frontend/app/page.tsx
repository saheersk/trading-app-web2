import { Appbar } from "./components/Appbar";
import { Markets } from "./components/Markets";

export default function Home() {
    return (
        <>
            <Appbar />
            <main className="flex min-h-screen flex-col items-center justify-between p-24">
                <Markets />
            </main>
        </>
    );
}
