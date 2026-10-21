// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import Head from './Head';
import Menus from './Menus';
import Myfoot from './Myfoot';

const AdminLTELayout = ({ children, title, breadcrumb }) => {
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Menus />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Head />
        <main className="flex-1">
          {(title || breadcrumb) && (
            <div className="border-b border-slate-200/80 bg-white/70">
              <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  {title && (
                    <h1 className="font-display text-xl font-extrabold tracking-tight text-navy-900">
                      {title}
                    </h1>
                  )}
                  <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Link to="/dashboard" className="transition hover:text-navy-700">
                      Tableau de bord
                    </Link>
                    {breadcrumb?.map((item, index) => (
                      <span key={index} className="flex items-center gap-1.5">
                        <span className="text-slate-300">/</span>
                        {item.link ? (
                          <Link to={item.link} className="transition hover:text-navy-700">
                            {item.label}
                          </Link>
                        ) : (
                          <span className="font-semibold text-slate-700">{item.label}</span>
                        )}
                      </span>
                    ))}
                  </nav>
                </div>
              </div>
            </div>
          )}
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
        <Myfoot />
      </div>
    </div>
  );
};

export default AdminLTELayout;
