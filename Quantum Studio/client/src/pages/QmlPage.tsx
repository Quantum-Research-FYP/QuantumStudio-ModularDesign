import React, { Suspense } from 'react';
import QmlApp from '../qml/QmlApp';

export default function QmlPage() {
  return (
    <div className="qml-scope qml-module-container" style={{ width: '100%', minHeight: '100vh' }}>
      <Suspense fallback={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', color: '#94a3b8' }}>
          Loading Quantum Machine Learning Laboratory...
        </div>
      }>
        <QmlApp />
      </Suspense>
    </div>
  );
}
