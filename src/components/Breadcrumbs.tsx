import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0) return null;

    return (
        <nav className="flex items-center space-x-2 text-xs font-medium text-gray-500 mb-6 overflow-x-auto whitespace-nowrap pb-1">
            <Link to="/" className="hover:text-primary-600 transition-colors flex items-center gap-1">
                <Home size={14} />
            </Link>
            
            {pathnames.map((value, index) => {
                const last = index === pathnames.length - 1;
                const to = `/${pathnames.slice(0, index + 1).join('/')}`;
                const displayName = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

                return (
                    <React.Fragment key={to}>
                        <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                        {last ? (
                            <span className="text-primary-700 font-bold truncate max-w-[150px]">
                                {displayName}
                            </span>
                        ) : (
                            <Link to={to} className="hover:text-primary-600 transition-colors capitalize">
                                {displayName}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
