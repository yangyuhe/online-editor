import React from 'react';
import fs from 'fs';
import Link from 'next/link';

const apps = fs.readdirSync(process.env.APPS_DIR);

export default function Home() {
  return (
    <div className='grid grid-cols-3 gap-4 p-2'>
      {apps.map((app) => (
        <div key={app} className='card  w-96 bg-base-100 shadow-xl'>
          <div className='card-body'>
            <h2 className='card-title'>{app}</h2>
            <div className='card-actions justify-end'>
              <Link className='btn btn-primary' href={`/project/${app}`}>
                进入
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
