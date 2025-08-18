import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';
import Empty from '../../../assets/profile-empty.svg';
import type { Review } from '../../../types/review';
import type { ReviewSubmitData } from '../../common/ReviewModal';
import { useReviews } from '../../../hooks/useReviews'; 

// Components
import ReviewCard from './ReviewHistoryCard';
import { FormTitle } from '../../layout/SettingsForm';
import Alert from '../../common/Alert';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import ReviewModal from '../../common/ReviewModal';

const ProfileReviews = () => {
  const navigate = useNavigate();
  // 🎣 Use reviews hook
  const {
    getUserReviewsWithTourInfo,
    isLoading,
    error,
    loadUserReviews,
    updateReview,
    deleteReview,
    clearError,
    selectReview,
    clearSelectedReview,
    currentReview
  } = useReviews();

  // Get reviews with tour info for display
  const reviews = getUserReviewsWithTourInfo();

  // ✏️ State for editing review
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);

  // 🗑️ State for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

   // 📄 Load user reviews on component mount
  useEffect(() => {
    loadUserReviews();
  }, [loadUserReviews]);

  // 🧹 Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
      clearSelectedReview();
    };
  }, [clearError, clearSelectedReview]);

  const handleEditReview = (review: Review) => {
    // Convert ReviewWithTourInfo back to Review for selection
    const reviewForEdit = {
      id: review.id,
      review: review.review,
      rating: review.rating,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      tour: review.tour, // This should be the tour ID string
      user: review.user
    };
    
    selectReview(reviewForEdit);
    setIsEditingModalOpen(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      selectReview({
        id: review.id,
        review: review.review,
        rating: review.rating,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        tour: review.tour,
        user: review.user
      });
      setIsDeleteModalOpen(true);
    }
  };

  const handleEditSubmit = async (data: ReviewSubmitData) => {
    if (currentReview && data.reviewId) {
      // 🎯 Update Review
      const result = await updateReview(data.reviewId, {
        rating: data.rating,
        review: data.review,
        updatedAt: new Date().toISOString()
      });
      
      if (result.success) {
        setIsEditingModalOpen(false);
        clearSelectedReview();
      }
    }
  };

  const handleEditCancel = () => {
    setIsEditingModalOpen(false);
    clearSelectedReview();
  };

  const confirmDeleteReview = async () => {
     if (currentReview) {
      const result = await deleteReview(currentReview.id);
      
      if (result.success) {
        setIsDeleteModalOpen(false);
        clearSelectedReview();
      }
    }
  };

  const cancelDeleteReview = () => {
    setIsDeleteModalOpen(false);
    clearSelectedReview();
  };

  // 🔄 Loading state
  if (isLoading) {
    return (
      <div className="container p-6 md:p-8">
        <FormTitle title="My Reviews" icon={<FiStar />} />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="ml-3 text-gray-600">Loading your reviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container p-6 md:p-8">
      <FormTitle title="My Reviews" icon={<FiStar />} />

      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={clearError}
        />
      )}

      {reviews.length === 0 ? (
        <div className="text-center p-10">
          <div className="text-gray-400 mb-4 flex flex-col justify-center items-center gap-2">
            <img 
              src={Empty} 
              alt="No Reviews" 
              className="mx-auto w-64 md:w-96 h-auto mb-8" 
            />
            <h3 className="text-xl font-semibold text-gray-900">No reviews yet</h3>
            <p className="text-gray-600 mb-8">Book a tour to leave a review!</p>
            <Button variant='primary' onClick={() => navigate('/')} fullWidth={true}>Browse Tours</Button>
          </div>
        </div>
      ) : (
        <ReviewCard 
          reviews={reviews}
          onEdit={handleEditReview}
          onDelete={handleDeleteReview}
        />
      )}
      {/* Edit Review Modal */}
      <ReviewModal
        isOpen={isEditingModalOpen}
        onClose={handleEditCancel}
        mode="edit"
        tourInfo={currentReview ? {
          id: typeof currentReview.tour === 'string' 
            ? currentReview.tour 
            : (currentReview.tour && 'id' in currentReview.tour 
                ? (currentReview.tour as { id: string }).id 
                : ''),
          name: reviews.find(r => r.id === currentReview.id)?.tourInfo?.name || 'Unknown Tour',
          slug: reviews.find(r => r.id === currentReview.id)?.tourInfo?.slug
        } : { id: '', name: '', slug: '' }}
        existingReview={currentReview ? {
          id: currentReview.id,
          rating: currentReview.rating,
          review: currentReview.review
        } : undefined}
        onSubmit={handleEditSubmit}
      />
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteReview}
        title="Delete Review"
        size="md"
      >
        <div className="text-center flex flex-col items-center gap-3">
          <h3 className="md:text-2xl text-xl font-medium text-gray-900 mb-2">
            Are you sure?
          </h3>
          <p className="text-gray-600 text-base">
            You are about to delete your review for{' '}
            <span className="font-bold italic text-emerald-500">{currentReview ? reviews.find(r => r.id === currentReview.id)?.tourInfo?.name : ''}</span>.
            This action cannot be undone.
          </p>
          <div className="flex justify-between w-full mt-6 space-x-16 px-4">
            <Button variant="secondary" onClick={cancelDeleteReview} fullWidth={true}> Cancel</Button>
            <Button variant="danger" onClick={confirmDeleteReview} fullWidth={true}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfileReviews;