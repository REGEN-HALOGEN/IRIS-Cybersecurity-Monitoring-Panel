import AlertDetail from './AlertDetail';

export function generateStaticParams() { return [{ id: '1' }]; }

export default function Page({ params }: { params: { id: string } }) { return <AlertDetail params={params} />; }
