import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, User, Building } from "lucide-react";

interface EntityOwnership {
  entityName: string;
  isNewEntity: boolean;
  ownershipPercentage: string;
}

const AccountSetup: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // User information
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  
  // Entity ownership
  const [entities, setEntities] = useState<EntityOwnership[]>([
    {
      entityName: "",
      isNewEntity: false,
      ownershipPercentage: ""
    }
  ]);

  // Existing entities that users can select from
  const existingEntities = [
    "5Central Capital",
    "The House Doctors", 
    "Arcadia Vision Group"
  ];

  const addEntity = () => {
    setEntities([...entities, {
      entityName: "",
      isNewEntity: false,
      ownershipPercentage: ""
    }]);
  };

  const removeEntity = (index: number) => {
    if (entities.length > 1) {
      setEntities(entities.filter((_, i) => i !== index));
    }
  };

  const updateEntity = (index: number, field: keyof EntityOwnership, value: string | boolean) => {
    const updated = [...entities];
    updated[index] = { ...updated[index], [field]: value };
    setEntities(updated);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const validateForm = () => {
    if (!email || !password || !firstName || !lastName) {
      showMessage('error', 'Please fill in all required fields');
      return false;
    }

    if (password !== confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long');
      return false;
    }

    // Validate entities
    for (const entity of entities) {
      if (!entity.entityName || !entity.ownershipPercentage) {
        showMessage('error', 'Please complete all entity information');
        return false;
      }

      const percentage = parseFloat(entity.ownershipPercentage);
      if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
        showMessage('error', 'Ownership percentage must be between 0 and 100');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          entities: entities.filter(e => e.entityName && e.ownershipPercentage).map(entity => ({
            entityName: entity.entityName,
            assetType: "real_estate",
            ownershipPercentage: parseFloat(entity.ownershipPercentage),
            currentValue: 0,
            description: ""
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      showMessage('success', 'Account created successfully! You can now log in with your credentials.');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/admin-login");
      }, 2000);
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Set up your account and define your entity ownership
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`rounded-md p-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Enter your personal details for account creation
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Entity Ownership */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-medium text-gray-900">Entity Ownership Setup</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Define your ownership in various entities and assets
            </p>
            
            <div className="space-y-4">
              {entities.map((entity, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      Entity {index + 1}
                    </h4>
                    {entities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntity(index)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={`entityName-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Entity Selection *
                      </label>
                      <div className="space-y-2">
                        <select
                          value={entity.isNewEntity ? "new" : entity.entityName}
                          onChange={(e) => {
                            if (e.target.value === "new") {
                              updateEntity(index, "isNewEntity", true);
                              updateEntity(index, "entityName", "");
                            } else {
                              updateEntity(index, "isNewEntity", false);
                              updateEntity(index, "entityName", e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select an entity or create new</option>
                          {existingEntities.map((entityName) => (
                            <option key={entityName} value={entityName}>
                              {entityName}
                            </option>
                          ))}
                          <option value="new">+ Create New Entity</option>
                        </select>
                        
                        {entity.isNewEntity && (
                          <input
                            type="text"
                            value={entity.entityName}
                            onChange={(e) => updateEntity(index, "entityName", e.target.value)}
                            placeholder="Enter new entity name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`ownershipPercentage-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Ownership Percentage *
                      </label>
                      <input
                        id={`ownershipPercentage-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={entity.ownershipPercentage}
                        onChange={(e) => updateEntity(index, "ownershipPercentage", e.target.value)}
                        placeholder="e.g., 50.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addEntity}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Another Entity
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/admin-login")}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Login
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSetup;