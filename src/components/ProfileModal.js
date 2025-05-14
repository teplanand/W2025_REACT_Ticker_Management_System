import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { X, Eye, EyeOff } from "lucide-react";

export default function ProfileModal({ onClose, onProfileUpdate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [ticketStats, setTicketStats] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    profile_picture: "",
    phone: "",
    oldPassword: "",
    newPassword: "",
  });
  const [newProfilePic, setNewProfilePic] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [profilePicToast, setProfilePicToast] = useState(null);

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      setLoading(true);
      const { data: userData, error: authError } = await supabase.auth.getUser();
      if (authError || !userData?.user?.id) {
        console.error("Auth error:", authError);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, profile_picture, phone")
        .eq("id", userData.user.id)
        .single();
      if (error) {
        console.error("Error fetching user profile:", error);
      } else if (data) {
        setUser(data);
        setFormData(data);
        fetchTicketStats(data);
      }
      setLoading(false);
    }
    fetchUserProfile();
  }, []);

  // Fetch ticket statistics based on role:
  async function fetchTicketStats(userInfo) {
    const role = userInfo.role.toLowerCase();
    if (role === "employee") {
      const { data: openData, error: openError } = await supabase
        .from("tickets")
        .select("id")
        .eq("status", "open");
      if (openError) {
        console.error("Error fetching open tickets:", openError);
        return;
      }
      const totalOpen = openData ? openData.length : 0;

      const { data: assignedData, error: assignError } = await supabase
        .from("assignments")
        .select("ticket_id")
        .eq("user_id", userInfo.id);
      if (assignError) {
        console.error("Error fetching assigned tickets:", assignError);
        return;
      }
      const assignedCount = assignedData ? assignedData.length : 0;

      const { data: closedData, error: closedError } = await supabase
        .from("tickets")
        .select("id")
        .eq("status", "closed")
        .eq("closed_by", userInfo.id);
      if (closedError) {
        console.error("Error fetching closed tickets:", closedError);
        return;
      }
      const closedCount = closedData ? closedData.length : 0;

      setTicketStats({ open: totalOpen, assigned: assignedCount, closed: closedCount });
    } else if (role === "admin") {
      const { count: totalTickets, error: ticketErr } = await supabase
        .from("tickets")
        .select("id", { head: true, count: "exact" });
      if (ticketErr) {
        console.error("Error fetching total tickets:", ticketErr);
        return;
      }
      const { count: totalUsers, error: userErr } = await supabase
        .from("users")
        .select("id", { head: true, count: "exact" });
      if (userErr) {
        console.error("Error fetching total users:", userErr);
        return;
      }
      const { count: totalEmployees, error: empErr } = await supabase
        .from("users")
        .select("id", { head: true, count: "exact" })
        .eq("role", "employee");
      if (empErr) {
        console.error("Error fetching total employees:", empErr);
        return;
      }
      setTicketStats({ totalTickets, totalUsers, totalEmployees });
    } else {
      const { data: ticketsData, error } = await supabase
        .from("tickets")
        .select("id, status")
        .eq("user_id", userInfo.id);
      if (error) {
        console.error("Error fetching ticket stats:", error);
        return;
      }
      const open = ticketsData.filter(ticket => ticket.status === "open").length;
      const closed = ticketsData.filter(ticket => ticket.status === "closed").length;
      const answered = ticketsData.filter(ticket => ticket.status === "answered").length;
      setTicketStats({ open, closed, answered });
    }
  }

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image.*")) {
        setErrorMessage("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size must be less than 5MB.");
        return;
      }
      setNewProfilePic(file);
      setErrorMessage("");
    }
  };

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    const formDataObj = new FormData();
    formDataObj.append("file", file);
    formDataObj.append("upload_preset", process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formDataObj }
      );
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  // Handle saving profile changes
  const handleSave = async () => {
    setUploadLoading(true);
    setErrorMessage("");
    try {
      let updatedData = { ...formData };
      if (newProfilePic) {
        const imageUrl = await uploadImageToCloudinary(newProfilePic);
        updatedData.profile_picture = imageUrl;
      }
      const { error: profileError } = await supabase
        .from("users")
        .update({
          name: updatedData.name,
          email: updatedData.email,
          phone: updatedData.phone,
          profile_picture: updatedData.profile_picture,
        })
        .eq("id", user.id);
      if (profileError) {
        setErrorMessage("Failed to update profile: " + profileError.message);
      } else {
        if (updatedData.newPassword) {
          if (!updatedData.oldPassword) {
            setErrorMessage("Please enter your old password.");
            return;
          }
          const { error: reauthError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: updatedData.oldPassword,
          });
          if (reauthError) {
            setErrorMessage("Old password is incorrect.");
            return;
          }
          const { error: passwordError } = await supabase.auth.updateUser({
            password: updatedData.newPassword,
          });
          if (passwordError) {
            setErrorMessage("Failed to update password: " + passwordError.message);
            return;
          }
        }
        // If a new profile picture was uploaded, set the toast message.
        if (newProfilePic) {
          setProfilePicToast(
            "Profile picture has changed successfully, changes will appear after closing the profile section."
          );
        }
        setUser(updatedData);
        localStorage.setItem("username", updatedData.name);
        localStorage.setItem("profilePicture", updatedData.profile_picture);
        setEditing(false);
        onProfileUpdate();
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred");
    } finally {
      setUploadLoading(false);
      setNewProfilePic(null);
      setFormData({ ...formData, oldPassword: "", newPassword: "" });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-lg flex justify-center items-center z-50">
        <div className="p-8 max-w-2xl bg-[#FFF2D8] rounded-xl shadow-lg text-center">
          <div className="py-10 text-[#113946]">Loading profile data...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-lg flex justify-center items-center z-50">
        <div className="p-8 max-w-2xl bg-[#FFF2D8] rounded-xl shadow-lg text-center">
          <div className="py-10 text-red-600">User profile not found</div>
          <button onClick={onClose} className="mt-3 bg-[#BCA37F] text-white px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-lg flex justify-center items-center z-50">
      <div className="relative p-8 w-full max-w-2xl bg-[#FFF2D8] rounded-xl shadow-lg text-center max-h-[90vh] overflow-y-auto">
        {/* Toast Notification */}
        {profilePicToast && (
          <div className="mb-4 p-3 bg-[#EAD7BB] text-[#113946] rounded">
            {profilePicToast}
          </div>
        )}
        <button onClick={onClose} className="absolute top-3 right-3 text-[#113946] hover:text-[#BCA37F]">
          <X size={24} />
        </button>
        {/* Updated header gradient using theme colors */}
        <div className="h-24 bg-gradient-to-r from-[#EAD7BB] to-[#BCA37F] rounded-t-lg" />
        <div className="-mt-12 flex flex-col items-center">
          <div className="relative">
            <label htmlFor="profilePicInput" className="cursor-pointer">
              <img
                src={
                  newProfilePic
                    ? URL.createObjectURL(newProfilePic)
                    : formData.profile_picture || "/default-avatar.png"
                }
                alt="Profile"
                className="w-28 h-28 rounded-full border-4 border-[#FFF2D8] shadow-md object-cover"
              />
              {editing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-full border-4 border-[#FFF2D8]">
                  <span className="text-[#FFF2D8] text-sm font-medium">Change</span>
                </div>
              )}
            </label>
            {editing && (
              <input
                type="file"
                id="profilePicInput"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploadLoading}
              />
            )}
          </div>
          {errorMessage && <div className="mt-2 text-red-500 text-sm">{errorMessage}</div>}
          {editing ? (
            <div className="w-full mt-4 space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#113946] text-left">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-[#EAD7BB] rounded-md text-[#113946] shadow-sm py-2 px-3 focus:outline-none focus:ring-[#113946] focus:border-[#113946]"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#113946] text-left">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-[#EAD7BB] rounded-md text-[#113946] shadow-sm py-2 px-3 focus:outline-none focus:ring-[#113946] focus:border-[#113946]"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#113946] text-left">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-[#EAD7BB] rounded-md text-[#113946] shadow-sm py-2 px-3 focus:outline-none focus:ring-[#113946] focus:border-[#113946]"
                />
              </div>
              <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium text-[#113946] text-left">
                  Old Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPassword ? "text" : "password"}
                    id="oldPassword"
                    name="oldPassword"
                    value={formData.oldPassword || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-[#EAD7BB] rounded-md text-[#113946] shadow-sm py-2 px-3 focus:outline-none focus:ring-[#113946] focus:border-[#113946]"
                    placeholder="Enter old password"
                  />
                  <button
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#113946] text-left">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-[#EAD7BB] rounded-md text-[#113946] shadow-sm py-2 px-3 focus:outline-none focus:ring-[#113946] focus:border-[#113946]"
                    placeholder="Enter new password"
                  />
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex space-x-2 pt-3">
                <button
                  onClick={handleSave}
                  disabled={uploadLoading}
                  className={`flex-1 py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white ${
                    uploadLoading ? "bg-[#BCA37F]" : "bg-[#113946] hover:bg-[#BCA37F]"
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#113946]`}
                >
                  {uploadLoading ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData(user);
                    setNewProfilePic(null);
                    setErrorMessage("");
                  }}
                  disabled={uploadLoading}
                  className="flex-1 py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-[#BCA37F] hover:bg-[#113946] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#113946]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              <h2 className="text-2xl font-bold text-[#113946]">{user.name}</h2>
              <span className="bg-[#113946] text-white px-3 py-1 rounded-full text-sm">{user.role}</span>
              <div className="text-[#113946]">
                <p>📧 {user.email}</p>
                {user.phone && <p>📱 {user.phone}</p>}
              </div>
              <button
                onClick={() => setEditing(true)}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-xl shadow-sm text-sm font-medium text-white bg-[#113946] hover:bg-[#BCA37F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#113946]"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Ticket statistics */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-[#113946] mb-3">Ticket Statistics</h3>
          {user.role.toLowerCase() === "employee" ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-[#EAD7BB]">
                <p className="text-2xl font-bold text-[#113946]">{ticketStats.open}</p>
                <p className="text-sm text-[#113946]">Open Tickets</p>
              </div>
              <div className="p-3 rounded-lg bg-[#BCA37F]">
                <p className="text-2xl font-bold text-[#FFF2D8]">{ticketStats.assigned}</p>
                <p className="text-sm text-[#FFF2D8]">Assigned Tickets</p>
              </div>
              <div className="p-3 rounded-lg bg-[#113946]">
                <p className="text-2xl font-bold text-[#FFF2D8]">{ticketStats.closed}</p>
                <p className="text-sm text-[#FFF2D8]">Closed Tickets</p>
              </div>
            </div>
          ) : user.role.toLowerCase() === "admin" ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-[#EAD7BB]">
                <p className="text-2xl font-bold text-[#113946]">{ticketStats.totalTickets}</p>
                <p className="text-sm text-[#113946]">Total Tickets</p>
              </div>
              <div className="p-3 rounded-lg bg-[#BCA37F]">
                <p className="text-2xl font-bold text-[#FFF2D8]">{ticketStats.totalUsers}</p>
                <p className="text-sm text-[#FFF2D8]">Total Users</p>
              </div>
              <div className="p-3 rounded-lg bg-[#113946]">
                <p className="text-2xl font-bold text-[#FFF2D8]">{ticketStats.totalEmployees}</p>
                <p className="text-sm text-[#FFF2D8]">Total Employees</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-[#EAD7BB]">
                <p className="text-2xl font-bold text-[#113946]">{ticketStats.open}</p>
                <p className="text-sm text-[#113946]">Open Tickets</p>
              </div>
              <div className="p-3 rounded-lg bg-[#BCA37F]">
                <p className="text-2xl font-bold text-[#FFF2D8]">{ticketStats.closed}</p>
                <p className="text-sm text-[#FFF2D8]">Closed Tickets</p>
              </div>
              <div className="p-3 rounded-lg bg-[#113946]">
                <p className="text-2xl font-bold text-[#FFF2D8]">{ticketStats.answered}</p>
                <p className="text-sm text-[#FFF2D8]">Answered Tickets</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
