import React from 'react';
import { apiService } from '../../services/api';

const ManagementPoints: React.FC = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Points & rewards</h2>
      <p className="text-gray-600">
        Award or redeem points from the Sales flow when processing a sale, or use the admin panel for manual adjustments.
        Customer points history is visible in the Point transactions section.
      </p>
      <p className="text-sm text-gray-500">
        To award points: link a sale to a customer by phone number when creating the sale, or use the award-points API from the admin.
      </p>
    </div>
  );
};

export default ManagementPoints;
