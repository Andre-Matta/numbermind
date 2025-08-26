import React, { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [shopData, setShopData] = useState([]);
  const [userSkins, setUserSkins] = useState(['default']);
  const [themeSkins, setThemeSkins] = useState({});
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const setAppData = (data) => {
    if (data.user) setUserData(data.user);
    if (data.shop) setShopData(data.shop);
    if (data.skins) setUserSkins(data.skins);
    if (data.themeSkins) setThemeSkins(data.themeSkins);
    setIsDataLoaded(true);
  };

  const updateUserData = (newUserData) => {
    setUserData(newUserData);
  };

  const updateShopData = (newShopData) => {
    setShopData(newShopData);
  };

  const updateUserSkins = (newSkins) => {
    setUserSkins(newSkins);
  };

  const clearData = () => {
    setUserData(null);
    setShopData([]);
    setUserSkins(['default']);
    setThemeSkins({});
    setIsDataLoaded(false);
  };

  const value = {
    userData,
    shopData,
    userSkins,
    themeSkins,
    isDataLoaded,
    setAppData,
    updateUserData,
    updateShopData,
    updateUserSkins,
    clearData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
