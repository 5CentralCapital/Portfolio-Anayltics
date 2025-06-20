import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, User, Building, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EntityOwnership {
  entityName: string;
  assetType: 'real_estate' | 'cash' | 'stocks' | 'bonds' | 'business' | 'other';
  ownershipPercentage: string;
  currentValue: string;
  description: string;
}

const AccountSetup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
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
      assetType: "real_estate",
      ownershipPercentage: "",
      currentValue: "",
      description: ""
    }
  ]);

  const addEntity = () => {
    setEntities([...entities, {
      entityName: "",
      assetType: "real_estate",
      ownershipPercentage: "",
      currentValue: "",
      description: ""
    }]);
  };

  const removeEntity = (index: number) => {
    if (entities.length > 1) {
      setEntities(entities.filter((_, i) => i !== index));
    }
  };

  const updateEntity = (index: number, field: keyof EntityOwnership, value: string) => {
    const updated = [...entities];
    updated[index] = { ...updated[index], [field]: value };
    setEntities(updated);
  };

  const validateForm = () => {
    if (!email || !password || !firstName || !lastName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return false;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }

    // Validate entities
    for (const entity of entities) {
      if (!entity.entityName || !entity.ownershipPercentage) {
        toast({
          title: "Validation Error",
          description: "Please complete all entity information",
          variant: "destructive",
        });
        return false;
      }

      const percentage = parseFloat(entity.ownershipPercentage);
      if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
        toast({
          title: "Validation Error",
          description: "Ownership percentage must be between 0 and 100",
          variant: "destructive",
        });
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
          entities: entities.filter(e => e.entityName && e.ownershipPercentage)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast({
        title: "Account Created Successfully",
        description: "You can now log in with your credentials",
      });

      // Redirect to login page
      navigate("/admin");
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const assetTypeOptions = [
    { value: "real_estate", label: "Real Estate" },
    { value: "cash", label: "Cash" },
    { value: "stocks", label: "Stocks" },
    { value: "bonds", label: "Bonds" },
    { value: "business", label: "Business" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Set up your account and define your entity ownership
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Enter your personal details for account creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Entity Ownership */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Entity Ownership Setup
              </CardTitle>
              <CardDescription>
                Define your ownership in various entities and assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {entities.map((entity, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Entity {index + 1}
                    </h4>
                    {entities.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEntity(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`entityName-${index}`}>Entity Name *</Label>
                      <Input
                        id={`entityName-${index}`}
                        type="text"
                        value={entity.entityName}
                        onChange={(e) => updateEntity(index, "entityName", e.target.value)}
                        placeholder="e.g., My Real Estate LLC"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`assetType-${index}`}>Asset Type *</Label>
                      <Select 
                        value={entity.assetType} 
                        onValueChange={(value) => updateEntity(index, "assetType", value as EntityOwnership['assetType'])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {assetTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`ownershipPercentage-${index}`}>Ownership Percentage *</Label>
                      <Input
                        id={`ownershipPercentage-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={entity.ownershipPercentage}
                        onChange={(e) => updateEntity(index, "ownershipPercentage", e.target.value)}
                        placeholder="e.g., 50.00"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`currentValue-${index}`}>Current Value (USD)</Label>
                      <Input
                        id={`currentValue-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={entity.currentValue}
                        onChange={(e) => updateEntity(index, "currentValue", e.target.value)}
                        placeholder="e.g., 500000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Input
                      id={`description-${index}`}
                      type="text"
                      value={entity.description}
                      onChange={(e) => updateEntity(index, "description", e.target.value)}
                      placeholder="Brief description of the entity or investment"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addEntity}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Another Entity
              </Button>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin")}
              className="flex-1"
            >
              Back to Login
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountSetup;