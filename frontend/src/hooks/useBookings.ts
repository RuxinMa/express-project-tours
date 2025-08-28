import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { bookingsService, BookingsError } from '../services/bookingsService';
import {
  setLoading,
  setSubmitting,
  setError,
  clearError,
  setUserBookings,
  updateUserBookingStatus,
  setCurrentBooking,
  clearCurrentBooking,
} from '../store/slices/bookingsSlice';
import type { BookingDisplayData, Booking } from '../types/booking';

export const useBookings = () => {
  const dispatch = useAppDispatch();
  
  // Select state from Redux
  const bookingsState = useAppSelector((state) => state.bookings);

  // 📖 Load user's bookings (Profile Page)
  const loadUserBookings = useCallback(async () => {

    dispatch(setLoading(true));
    dispatch(clearError());

    try {
      console.log('📄 useBookings: Loading user bookings...');
      
      const bookings = await bookingsService.fetchUserBookings();
      
      dispatch(setUserBookings(bookings));
      dispatch(setLoading(false));
      
      console.log(`✅ useBookings: Successfully loaded ${bookings.length} user bookings`);
      return { success: true };
      
    } catch (error) {
      console.error('🚨 useBookings: Failed to load user bookings:', error);
      
      const errorMessage = error instanceof BookingsError 
        ? error.message 
        : 'Failed to load your bookings. Please try again.';
        
      dispatch(setError(errorMessage));
      dispatch(setLoading(false));
      
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  // 💳 Create checkout session (Tour Detail Page)
  const createCheckoutSession = useCallback(async (tourId: string) => {
    dispatch(setSubmitting(true));
    dispatch(clearError());

    try {
      console.log(`💳 useBookings: Creating checkout session for tour ${tourId}...`);
      
      const { sessionId, url } = await bookingsService.getCheckoutSession(tourId);
      
      dispatch(setSubmitting(false));
      
      console.log('✅ useBookings: Successfully created checkout session');
      
      // Redirect to Stripe checkout
      window.location.href = url;
      
      return { success: true, sessionId, url };
      
    } catch (error) {
      console.error(`🚨 useBookings: Failed to create checkout session for tour ${tourId}:`, error);
      
      const errorMessage = error instanceof BookingsError 
        ? error.message 
        : 'Failed to create checkout session. Please try again.';
        
      dispatch(setError(errorMessage));
      dispatch(setSubmitting(false));
      
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  // 🔄 Update booking status (Profile Page)
  const updateBookingStatus = useCallback(async (bookingId: string, status: Booking['status']) => {
    dispatch(setSubmitting(true));
    dispatch(clearError());

    try {
      console.log(`🔄 useBookings: Updating booking ${bookingId} status to ${status}...`);
      
      await bookingsService.updateBookingStatus(bookingId, status);
      
      // Update local state
      dispatch(updateUserBookingStatus({ bookingId, status }));
      dispatch(setSubmitting(false));
      
      console.log('✅ useBookings: Successfully updated booking status');
      return { success: true };
      
    } catch (error) {
      console.error(`🚨 useBookings: Failed to update booking ${bookingId} status:`, error);
      
      const errorMessage = error instanceof BookingsError 
        ? error.message 
        : 'Failed to update booking status. Please try again.';
        
      dispatch(setError(errorMessage));
      dispatch(setSubmitting(false));
      
      return { success: false, error: errorMessage };
    }
  }, [dispatch]);

  // 🎯 Helper functions for cross-domain coordination
  
  // Find booking by tour ID (used for review-booking coordination)
  const findBookingByTourId = useCallback((tourId: string): BookingDisplayData | undefined => {
    return bookingsState.userBookings.find(booking => booking.tourId === tourId);
  }, [bookingsState.userBookings]);

  // Get bookings that are pending review
  const getPendingReviewBookings = useCallback((): BookingDisplayData[] => {
    return bookingsState.userBookings.filter(booking => booking.status === 'pending-review');
  }, [bookingsState.userBookings]);

  // Mark booking as reviewed (called from review creation)
  const markBookingAsReviewed = useCallback((tourId: string): Promise<{ success: boolean; error?: string }> => {
    const booking = findBookingByTourId(tourId);
    if (!booking) {
      console.warn(`⚠️ No booking found for tour ${tourId}`);
      return Promise.resolve({ success: false, error: 'Booking not found' });
    }
    
    if (booking.status !== 'pending-review') {
      console.warn(`⚠️ Booking ${booking.id} is not in pending-review status`);
      return Promise.resolve({ success: false, error: 'Booking is not pending review' });
    }
    
    return updateBookingStatus(booking.id, 'reviewed');
  }, [findBookingByTourId, updateBookingStatus]);

  // Mark booking as pending review (called from review deletion)
  const markBookingAsPendingReview = useCallback((tourId: string): Promise<{ success: boolean; error?: string }> => {
    const booking = findBookingByTourId(tourId);
    if (!booking) {
      console.warn(`⚠️ No booking found for tour ${tourId}`);
      return Promise.resolve({ success: false, error: 'Booking not found' });
    }
    
    if (booking.status !== 'reviewed') {
      console.warn(`⚠️ Booking ${booking.id} is not in reviewed status`);
      return Promise.resolve({ success: false, error: 'Booking is not reviewed' });
    }
    
    return updateBookingStatus(booking.id, 'pending-review');
  }, [findBookingByTourId, updateBookingStatus]);

  // Get booking status for a specific tour
  const getTourBookingStatus = useCallback((tourId: string): Booking['status'] | null => {
    const booking = findBookingByTourId(tourId);
    return booking ? booking.status : null;
  }, [findBookingByTourId]);

  // 🧹 Clear functions
  const clearBookingsError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const selectBooking = useCallback((booking: Booking) => {
    dispatch(setCurrentBooking(booking));
  }, [dispatch]);

  const clearSelectedBooking = useCallback(() => {
    dispatch(clearCurrentBooking());
  }, [dispatch]);

  return {
    // 📊 State
    userBookings: bookingsState.userBookings,
    currentBooking: bookingsState.currentBooking,
    isLoading: bookingsState.isLoading,
    isSubmitting: bookingsState.isSubmitting,
    error: bookingsState.error,
    
    // 📖 Data Loading
    loadUserBookings,          // Profile Page
    
    // 💳 Checkout & Booking Operations
    createCheckoutSession,     // Tour Detail Page
    updateBookingStatus,
    
    // 🎯 Helper Functions
    findBookingByTourId,
    getPendingReviewBookings,
    getTourBookingStatus,
    
    // 🔄 Cross-domain Coordination (for Review-Booking integration)
    markBookingAsReviewed,     // Called when review is created
    markBookingAsPendingReview, // Called when review is deleted
    
    // 🔧 Utility
    selectBooking,
    clearSelectedBooking,
    clearError: clearBookingsError,
  };
};