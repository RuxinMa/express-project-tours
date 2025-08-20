/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* 🎯 Business logic layer
  - combines authService with Redux state management
*/

import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { authService } from '../services/authService';
import {
  setUser,
  clearUser,
  setLoading,
  setError,
  clearError,
  updateUser,
} from '../store/slices/authSlice'; // Import actions from authSlice

export const useAuth = () => {
  const dispatch = useAppDispatch();
  
  // Select auth state from Redux store
  const authState = useAppSelector((state) => state.auth);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    if (authState.isInitialized) {
      return; // Already initialized, don't check again
    }

    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      console.log('🔐 useAuth: Initializing authentication...');
      
      const user = await authService.checkAuthStatus();
      dispatch(setUser(user));
      
      console.log('🔐 useAuth: Authentication initialized successfully');
    } catch (error: any) {
      console.log('🔐 useAuth: No authenticated user found');
      dispatch(clearUser()); // Clear state and mark as initialized
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, authState.isInitialized]);

  // 👤 Login current user
  const login = useCallback(async (email: string, password: string) => {
    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      console.log('🔐 useAuth: Starting login process...');
      
      const user = await authService.login(email, password);
      console.log('🔐 useAuth: authService returned user:', user); 
      console.log('🔐 useAuth: user type:', typeof user, 'user keys:', user ? Object.keys(user) : 'null'); 
      
      if (!user) {
        throw new Error('Login service returned null user');
      }
      
      dispatch(setUser(user));
      console.log('🔐 useAuth: dispatched setUser action'); 
      
      console.log('🔐 useAuth: Login completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('🔐 useAuth: Login failed:', error.message);
      
      const errorMessage = error.message || 'Login failed. Please try again.';
      dispatch(setError(errorMessage));
      
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  //   Logout current user
  const logout = useCallback(async () => {
    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      console.log('🔐 useAuth: Starting logout process...');
      
      await authService.logout();
      dispatch(clearUser());
      
      console.log('🔐 useAuth: Logout completed successfully');
      return { success: true };
    } catch (error: any) {
      console.warn('🔐 useAuth: Logout API failed, but clearing local state');
      
      // Clear local state even if API call fails
      dispatch(clearUser());
      return { success: true }; // Always succeed for logout
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  // Register new user
  const register = useCallback(async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      console.log('🔐 useAuth: Starting registration process...');
      
      const user = await authService.register(userData);
      dispatch(setUser(user));
      
      console.log('🔐 useAuth: Registration completed successfully');
      return { success: true };
    } catch (error: any) {
      console.error('🔐 useAuth: Registration failed:', error.message);
      
      const errorMessage = error.message || 'Registration failed. Please try again.';
      dispatch(setError(errorMessage));
      
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (userData: Partial<any>) => {
    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      console.log('🔐 useAuth: Updating user profile...');
      
      const updatedUser = await authService.updateProfile(userData);

      // Update user information in Redux store
      dispatch(updateUser(updatedUser));
      dispatch(setLoading(false));

      console.log('🔐 useAuth: Profile updated successfully');
      return { success: true, user: updatedUser };

    } catch (error: any) {
      console.error('🔐 useAuth: Profile update failed:', error.message);
      
      const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to update profile. Please try again.';
      
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));

      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  /**
   * Clear error message
   */
  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Return auth state and operations
  return {
    // State
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    error: authState.error,
    isInitialized: authState.isInitialized,
    
    // Operations
    initializeAuth,
    login,
    logout,
    register,
    updateProfile,
    clearError: clearAuthError,
  };
};