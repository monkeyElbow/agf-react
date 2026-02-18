import { Link } from 'react-router-dom';
import { useContentAdmin } from '../context/ContentAdminContext';

export default function PageBreadcrumbs({ path }) {
  const { getBreadcrumbTrail } = useContentAdmin();
  const trail = getBreadcrumbTrail(path);

  if (!trail.length || path === '/') {
    return null;
  }

  return (
    <nav className="native-breadcrumbs" aria-label="Breadcrumb">
      <div className="ag-panel-rail">
        <ol>
          {trail.map((item, index) => {
            const isLast = index === trail.length - 1;
            return (
              <li key={item.path} className={isLast ? 'is-current' : 'is-parent'}>
                {isLast ? <span>{item.label}</span> : <Link to={item.path}>{item.label}</Link>}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
