import { createBrowserRouter } from 'react-router-dom';
import ProjectsPage from './app/projects/page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProjectsPage />,
  },
]); 