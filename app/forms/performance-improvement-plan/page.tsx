import React from 'react';

export default function PerformanceImprovementPlan() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Performance Improvement Plan</h1>
      
      {/* Purpose Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Purpose</h2>
        <p className="mb-4">The purpose of the Performance Improvement Plan is to document performance concerns and create a path for improvement.</p>
      </section>

      {/* Employee Information */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Employee Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Employee Name</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Manager</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
      </section>

      {/* Relevant Dates */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Relevant Dates</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Initiation Date</label>
            <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Duration of PIP</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">From</label>
            <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">To</label>
            <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
      </section>

      {/* Performance Expectations */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Performance Expectations</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Describe the performance expectations and standards that must be met
            </label>
            <textarea 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Specific actions to be taken
            </label>
            <textarea 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
              rows={4}
            />
          </div>
        </div>
      </section>

      {/* Signatures */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Signatures</h2>
        <p className="mb-4">This Performance Improvement Plan must be signed by the employee and manager.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Employee Signature</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Manager Signature</label>
            <input type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input type="date" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button 
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
        >
          Save Draft
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
        >
          Submit Form
        </button>
      </div>
    </div>
  );
}
