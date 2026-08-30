import { SentrioApp } from './sentrio-app';

export default function Home() {
  return <SentrioApp initialNow={new Date().toISOString()} />;
}
