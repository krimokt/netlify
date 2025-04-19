"use client";
import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase"; // Import Supabase client

// Define the profile data type
type ProfileData = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country?: string;
   // Add role
  updated_at?: string; // Keep updated_at for consistency if needed
};

// No longer needed as we fetch directly
// const getInitialProfileData = (): ProfileData => { ... };

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null); // Start with null
  const [loadingProfile, setLoadingProfile] = useState(true); // Loading state for profile fetch

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }
      
      setLoadingProfile(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, email, phone, country, updated_at') // Select desired fields
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile data:", error);
          
          // Check if the error is because the profile doesn't exist
          // PostgreSQL error code for 'no rows returned' is 'PGRST116'
          if (error.code === 'PGRST116' || error.message?.includes('no rows')) {
            console.log("No profile found, creating one for user:", user.id);
            
            // Extract user metadata from auth user
            const firstName = user.user_metadata?.first_name || '';
            const lastName = user.user_metadata?.last_name || '';
            const email = user.email || '';
            
            // Create a new profile
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                { 
                  id: user.id,
                  first_name: firstName,
                  last_name: lastName,
                  full_name: `${firstName} ${lastName}`.trim(),
                  email: email,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ])
              .select('first_name, last_name, email, phone, country, updated_at')
              .single();
            
            if (insertError) {
              console.error("Error creating profile:", insertError);
              setProfileData(null);
            } else {
              console.log("Profile created successfully:", newProfile);
              setProfileData(newProfile);
            }
          } else {
            // Some other error occurred
            setProfileData(null);
          }
        } else if (data) {
          setProfileData(data);
        }
      } catch (err) {
        console.error("Exception fetching profile data:", err);
        setProfileData(null);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [user]); // Re-fetch when user changes

  // Get profile data safely
  const firstName = profileData?.first_name || "";
  const lastName = profileData?.last_name || "";
  const email = profileData?.email || user?.email || ""; // Fallback to user email
  const phone = profileData?.phone || "";
  const country = profileData?.country;
  

  // Format WhatsApp number for link
  const getWhatsAppLink = () => {
    if (!phone) return "#";
    const cleanNumber = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  // Update profile data and save to localStorage - COMMENTED OUT
  // const saveProfileData = (updatedData: ProfileData) => { ... };

  const handleSave = async () => {
    if (!user || !profileData) {
      console.error("User or profile data missing");
      return;
    }
    
    // Get form data
    const form = document.querySelector('form') as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const updatedData = {
      first_name: formData.get('firstName') as string || profileData.first_name,
      last_name: formData.get('lastName') as string || profileData.last_name,
      phone: formData.get('phone') as string || profileData.phone,
      country: formData.get('country') as string || profileData.country,
      updated_at: new Date().toISOString(),
    };
    
    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update(updatedData)
        .eq('id', user.id);
        
      if (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
        return;
      }
      
      // Update local state
      setProfileData({
        ...profileData,
        ...updatedData
      });
      
      alert("Profile updated successfully!");
      closeModal();
    } catch (err) {
      console.error("Exception updating profile:", err);
      alert("An error occurred while updating your profile.");
    }
  };
  
  // Format the updated date
  const formatUpdatedDate = () => {
    if (!profileData?.updated_at) return "";
    try {
      const date = new Date(profileData.updated_at);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return "";
    }
  };

  if (loadingProfile) {
    // Optional: Add a specific loading state for the card
    return (
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 animate-pulse">
        <div className="h-6 mb-3 bg-gray-200 rounded dark:bg-gray-700 w-1/3"></div>
        <div className="grid grid-cols-1 gap-y-6 md:grid-cols-2 md:gap-x-4 md:gap-y-7">
          <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
          <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
          <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
          <div className="h-10 bg-gray-200 rounded dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  if (!profileData && !loadingProfile) {
     // Handle case where profile couldn't be loaded
     return (
       <div className="p-5 border border-red-200 rounded-2xl dark:border-red-800 lg:p-6 bg-red-50 dark:bg-red-900/20">
         <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
           Error Loading Profile
         </h3>
         <p className="text-sm text-red-600 dark:text-red-300">Could not fetch user information.</p>
       </div>
     );
  }

  return (
    <>
      <div className="relative p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            User Information
          </h3>
          <button
            onClick={openModal}
            className="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-full text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
          </button>
        </div>
        <div className="mb-6 grid grid-cols-1 gap-y-6 md:grid-cols-2 md:gap-x-4 md:gap-y-7">
          <div className="md:col-span-1">
            <span className="mb-2 block text-sm font-normal text-gray-500 dark:text-gray-400">
              Full Name
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || "Not provided")}
            </span>
          </div>
          <div className="md:col-span-1">
            <span className="mb-2 block text-sm font-normal text-gray-500 dark:text-gray-400">
              Email
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90">
              {email}
            </span>
          </div>
          <div className="md:col-span-1">
            <span className="mb-2 block text-sm font-normal text-gray-500 dark:text-gray-400">
              Phone (WhatsApp)
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white/90">
              {phone || "Not provided"}
              {phone && (
                <a 
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noreferrer" 
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white bg-green-500 hover:bg-green-600"
                >
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 20 20" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M10.0025 0H9.9975C4.48375 0 0 4.485 0 10C0 12.1875 0.705 14.215 1.90375 15.8612L0.6575 19.5763L4.50125 18.3475C6.0825 19.395 7.96875 20 10.0025 20C15.5162 20 20 15.5138 20 10C20 4.48625 15.5162 0 10.0025 0Z"
                      fill="white" 
                    />
                    <path 
                      d="M15.8212 14.1212C15.5799 14.8025 14.6224 15.3675 13.8587 15.5325C13.3362 15.6437 12.6537 15.7325 10.3562 14.78C7.41744 13.5625 5.52494 10.5762 5.37744 10.3825C5.23619 10.1887 4.18994 8.80123 4.18994 7.36623C4.18994 5.93123 4.91869 5.23248 5.21244 4.93248C5.45369 4.68623 5.85244 4.57373 6.23494 4.57373C6.35869 4.57373 6.46994 4.57998 6.56994 4.58498C6.86369 4.59748 7.01119 4.61498 7.20494 5.07873C7.44619 5.65998 8.03369 7.09498 8.10369 7.24248C8.17494 7.38998 8.24619 7.58998 8.14619 7.78373C8.05244 7.98373 7.96994 8.07248 7.82244 8.24248C7.67494 8.41248 7.53494 8.54248 7.38744 8.72498C7.25369 8.88373 7.09994 9.05373 7.26994 9.34748C7.43994 9.63498 8.02744 10.5937 8.89244 11.3637C10.0087 12.3575 10.9137 12.675 11.2374 12.8087C11.4787 12.9075 11.7662 12.8875 11.9424 12.6987C12.1662 12.4575 12.4424 12.0575 12.7237 11.6637C12.9237 11.3812 13.1762 11.3462 13.4412 11.4462C13.7112 11.54 15.1399 12.2462 15.4337 12.3925C15.7274 12.54 15.9212 12.61 15.9924 12.7337C16.0624 12.8575 16.0624 13.4387 15.8212 14.1212Z"
                      fill="#4CAF50" 
                    />
                  </svg>
                </a>
              )}
            </span>
          </div>
          {country && (
            <div className="md:col-span-1">
              <span className="mb-2 block text-sm font-normal text-gray-500 dark:text-gray-400">
                Country
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                {country}
              </span>
            </div>
          )}
         
          {profileData?.updated_at && (
            <div className="md:col-span-2">
              <span className="mb-2 block text-xs text-gray-400 dark:text-gray-500">
                Last updated: {formatUpdatedDate()}
              </span>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px]">
        <div className="no-scrollbar relative max-h-[90vh] w-full overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-9">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit User Information
            </h4>
            <p className="mb-9 text-sm text-gray-500 dark:text-gray-400">
              Update your personal information.
            </p>
          </div>
          <form className="w-full" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <div className="px-2">
              <div className="mb-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90">
                  Personal Details
                </h5>
                <div className="grid grid-cols-1 gap-5 gap-y-4 md:grid-cols-2">
                  <div className="md:col-span-1">
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                      defaultValue={firstName}
                      placeholder="John"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                      defaultValue={lastName}
                      placeholder="Doe"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                      defaultValue={phone}
                      placeholder="+1234567890"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="mb-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-sm placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                      defaultValue={country}
                      placeholder="United States"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-2">
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-700">
                <Button
                  variant="outline"
                  className="px-4 py-2.5 lg:px-5"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-4 py-2.5 lg:px-5"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
