import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { QuotePage } from '@/pages/QuotePage';
import { DetailedQuotePage } from '@/pages/DetailedQuotePage';
import { QuoteResultPage } from '@/pages/QuoteResult';
import { MyQuotes } from '@/pages/MyQuotes';
import { Admin } from '@/pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/quote"
              element={
                <ProtectedRoute>
                  <QuotePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quote/detailed"
              element={
                <ProtectedRoute>
                  <DetailedQuotePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quote-result/:id"
              element={
                <ProtectedRoute>
                  <QuoteResultPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-quotes"
              element={
                <ProtectedRoute>
                  <MyQuotes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

