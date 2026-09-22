import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/layout/Layout';
import Landing from './pages/Landing';
import Demo from './pages/Demo';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import DLQ from './pages/DLQ';
import Retries from './pages/Retries';
// Add these:
import Architecture from './pages/Architecture';
import Status from './pages/Status';
import Playground from './pages/Playground';
import './index.css';
import Projects from './pages/Projects';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/dlq" element={<DLQ />} />
            <Route path="/retries" element={<Retries />} />
            <Route path="/architecture" element={<Architecture />} />
            <Route path="/status" element={<Status />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/projects" element={<Projects />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;