import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomAlert, { AlertType } from '../components/CustomAlert';

interface AlertContextType {
    showAlert: (message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [alert, setAlert] = useState<{ message: string, type: AlertType, isOpen: boolean }>({
        message: '',
        type: 'info',
        isOpen: false
    });

    const showAlert = useCallback((message: string, type: AlertType = 'info') => {
        setAlert({ message, type, isOpen: true });
    }, []);

    const hideAlert = useCallback(() => {
        setAlert(prev => ({ ...prev, isOpen: false }));
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <CustomAlert
                message={alert.message}
                type={alert.type}
                isOpen={alert.isOpen}
                onClose={hideAlert}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
