import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States';

export default function NotFound() {
  return <EmptyState title="Page not found" hint="The page you opened does not exist or was moved." action={<Link className="btn" to="/">Go to the start page</Link>} />;
}
