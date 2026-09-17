import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider, useI18n } from './i18n';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { DataProvider } from './data/DataContext';
import { LoginScreen } from './screens/LoginScreen';
import { FleetScreen } from './screens/FleetScreen';
import { AddEquipmentScreen } from './screens/AddEquipmentScreen';
import { DetailScreen } from './screens/DetailScreen';
import { ScheduleScreen } from './screens/ScheduleScreen';
import { VendorsScreen } from './screens/VendorsScreen';
import { FaultLogScreen } from './screens/FaultLogScreen';
import { PeopleScreen } from './screens/PeopleScreen';
import { ReportsScreen } from './screens/ReportsScreen';

function DirSync() {
  const { dir, locale } = useI18n();
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);
  return null;
}

function Gate() {
  const { person, loading } = useAuth();
  if (loading) return null;
  if (!person) return <LoginScreen />;
  return (
    <Routes>
      <Route path="/" element={<FleetScreen />} />
      <Route path="/add" element={<AddEquipmentScreen />} />
      <Route path="/units/:id" element={<DetailScreen />} />
      <Route path="/schedule" element={<ScheduleScreen />} />
      <Route path="/vendors" element={<VendorsScreen />} />
      <Route path="/vendors/:name" element={<VendorsScreen />} />
      <Route path="/log" element={<FaultLogScreen />} />
      <Route path="/people" element={<PeopleScreen />} />
      <Route path="/reports" element={<ReportsScreen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <I18nProvider>
        <DirSync />
        <AuthProvider>
          <DataProvider>
            <Gate />
          </DataProvider>
        </AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
