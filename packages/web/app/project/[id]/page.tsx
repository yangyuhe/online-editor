'use client';

import Icon from '../../components/icon';
import { ProjectContextProvider } from './context';
import Directory from './directory';

export default function Project(props: { params: { id: string } }) {
    const {
        params: { id }
    } = props;
    return (
        <ProjectContextProvider projectId={id}>
            <div className='flex h-full'>
                <ul className='menu bg-base-200'>
                    <li>
                        <a>
                            <Icon name='file-text' className='text-[20px]' />
                        </a>
                    </li>
                    <li>
                        <a>
                            <Icon name='setting' className='text-[20px]' />
                        </a>
                    </li>
                </ul>
                <div className='w-[200px] bg-base-300'>
                    <Directory />
                </div>
                <div className='flex-auto bg-base-100'></div>
            </div>
        </ProjectContextProvider>
    );
}
