import { Link } from 'react-router-dom';
import { EmptyState } from '../components/States';

export default function Forbidden() {
  return <EmptyState title="No access" hint="Your account does not have permission to open this page. Ask an administrator if you need it." action={<Link className="btn" to="/">Go to the start page</Link>} />;
}
