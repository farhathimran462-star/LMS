import '../../Styles/Reusable/DynamicProfile.css';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabaseClient';

// Import necessary React Icons
import { FaCrown, FaCog, FaChalkboardTeacher, FaBook, FaUser, FaEnvelope, FaPhoneAlt, FaHistory, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { IoAlertCircleOutline, IoReloadCircleSharp } from 'react-icons/io5';

// --- Fetch Real Profile Data from Session/Database ---
const fetchProfileData = async (userRole) => {
  try {
    // Get user data from session storage
    const userData = JSON.parse(sessionStorage.getItem('userData') || localStorage.getItem('userData') || '{}');
    
    console.log('📋 User Data from session:', userData);
    
    if (!userData || !userData.user_id) {
      throw new Error('No user data found in session');
    }

    // Fetch user data from database
    let password = '********';
    let phone = userData.phone || userData.contact || 'N/A';
    let username = userData.username || userData.user_name || 'N/A';
    let fullname = userData.full_name || userData.name || 'User';
    
    try {
      const { data: userRecord, error } = await supabase
        .from('Users')
        .select('password, phone, username, full_name')
        .eq('user_id', userData.user_id)
        .single();
      
      if (!error && userRecord) {
        password = userRecord.password;
        phone = userRecord.phone || phone;
        username = userRecord.username || username;
        fullname = userRecord.full_name || fullname;
        console.log('✅ User data fetched from database');
      }
    } catch (err) {
      console.error('❌ Error fetching user data:', err);
    }

    // Fetch role-specific data
    let roleSpecificData = {};
    
    if (userRole === 'Student') {
      // Fetch student data
      try {
        console.log('🔍 Fetching student data for user_id:', userData.user_id);
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('roll_number, institute_id')
          .eq('user_id', userData.user_id)
          .single();
        
        console.log('📊 Student data response:', { studentData, studentError });
        
        if (studentError) {
          console.error('❌ Error fetching student data:', studentError);
          console.error('❌ Error details:', JSON.stringify(studentError));
        }
        
        if (studentData) {
          roleSpecificData = {
            roll_number: studentData.roll_number || 'N/A',
            institute_name: 'N/A'
          };
          
          console.log('📊 Student institute_id:', studentData.institute_id);
          
          // Fetch institution name separately
          if (studentData.institute_id) {
            console.log('🔍 Fetching institution for id:', studentData.institute_id);
            const { data: instData, error: instError } = await supabase
              .from('institutions')
              .select('institute_name')
              .eq('id', studentData.institute_id)
              .single();
            
            console.log('📊 Institution data response:', { instData, instError });
            
            if (instError) {
              console.error('❌ Institution fetch error:', instError);
            }
            
            if (!instError && instData) {
              roleSpecificData.institute_name = instData.institute_name || 'N/A';
              console.log('✅ Institute name set to:', roleSpecificData.institute_name);
            }
          }
          
          console.log('✅ Student data processed:', roleSpecificData);
        } else if (!studentError) {
          console.warn('⚠️ No student data found for user_id:', userData.user_id);
        }
      } catch (err) {
        console.error('❌ Exception fetching student data:', err);
      }
    } else if (userRole === 'Admin') {
      // Fetch admin data and managed institutions
      try {
        console.log('🔍 Fetching admin data for user_id:', userData.user_id);
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('id, employee_id')
          .eq('user_id', userData.user_id)
          .single();
        
        console.log('📊 Admin data response:', { adminData, adminError });
        
        if (adminError) {
          console.error('❌ Error fetching admin data:', adminError);
        }
        
        if (adminData) {
          roleSpecificData.employee_id = adminData.employee_id || 'N/A';
          
          // Fetch managed institutions
          console.log('🔍 Fetching admin institutions for admin_id:', adminData.id);
          const { data: adminInstitutionsData, error: instError } = await supabase
            .from('admin_institutions')
            .select('institute_id')
            .eq('admin_id', adminData.id);
          
          console.log('📊 Admin institutions response:', { adminInstitutionsData, instError });
          
          if (instError) {
            console.error('❌ Error fetching admin institutions:', instError);
          }
          
          if (adminInstitutionsData && adminInstitutionsData.length > 0) {
            // Fetch institution names for each institute_id
            const instituteIds = adminInstitutionsData.map(item => item.institute_id).filter(Boolean);
            console.log('📊 Institute IDs:', instituteIds);
            
            if (instituteIds.length > 0) {
              const { data: institutionsData, error: instNamesError } = await supabase
                .from('institutions')
                .select('id, institute_name')
                .in('id', instituteIds);
              
              console.log('📊 Institutions names response:', { institutionsData, instNamesError });
              
              if (!instNamesError && institutionsData && institutionsData.length > 0) {
                const institutionNames = institutionsData
                  .map(item => item.institute_name)
                  .filter(Boolean)
                  .join(', ');
                roleSpecificData.managed_institutions = institutionNames || 'N/A';
                console.log('✅ Managed institutions:', institutionNames);
              } else {
                console.error('❌ Error or no data:', instNamesError);
                roleSpecificData.managed_institutions = 'N/A';
              }
            } else {
              roleSpecificData.managed_institutions = 'N/A';
            }
          } else {
            roleSpecificData.managed_institutions = 'N/A';
          }
        }
      } catch (err) {
        console.error('❌ Exception fetching admin data:', err);
      }
    } else if (userRole === 'SuperAdmin') {
      // Fetch super admin data
      try {
        console.log('🔍 Fetching super admin data for user_id:', userData.user_id);
        const { data: superAdminData, error: superAdminError } = await supabase
          .from('super_admins')
          .select('employee_id')
          .eq('user_id', userData.user_id)
          .single();
        
        console.log('📊 Super admin data response:', { superAdminData, superAdminError });
        
        if (superAdminError) {
          console.error('❌ Error fetching super admin data:', superAdminError);
        }
        
        if (superAdminData) {
          roleSpecificData.employee_id = superAdminData.employee_id || 'N/A';
          console.log('✅ Super admin employee_id:', roleSpecificData.employee_id);
        }
      } catch (err) {
        console.error('❌ Exception fetching super admin data:', err);
      }
    } else if (userRole === 'Teacher') {
      // Fetch teacher data
      try {
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('employee_id')
          .eq('user_id', userData.user_id)
          .single();
        
        if (!teacherError && teacherData) {
          roleSpecificData.employee_id = teacherData.employee_id || 'N/A';
        }
      } catch (err) {
        console.error('❌ Error fetching teacher data:', err);
      }
    }
    
    return {
      username: username,
      fullname: fullname,
      email: userData.email || 'N/A',
      password: password,
      phone: phone,
      role: userRole,
      photo_url: userData.photo || userData.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&size=200&background=random&color=fff&bold=true`,
      ...roleSpecificData
    };
  } catch (error) {
    console.error('Error fetching profile data:', error);
    throw error;
  }
};

const DynamicProfile = ({ userRole = 'SuperAdmin' }) => {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!userRole || typeof userRole !== 'string') {
        setError('Invalid or missing userRole prop.');
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    fetchProfileData(userRole)
      .then(data => {
        if (data) {
          setProfile(data);
        } else {
          setError(`Profile data not found for role: ${userRole}`);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userRole]); 

  const ICON_SIZE_ROLE_BADGE = 14; // Matches small text size for role badge
  const ICON_SIZE_CARD_TITLE = 18; // Matches card title font size
  const ICON_SIZE_INFO_ROW = 24;   // Fits well in 40px icon box (DYPR_info-icon)
  const ICON_SIZE_ROLE_EMOJI = 26; // Fits well in 40px badge (DYPR_role-icon-badge)
  const ICON_SIZE_LOADING_ERROR = 40; // Matches spinner/error icon size

  if (isLoading) {
    return (
      <div className="DYPR_loading-container">
        {/* Replaced DYPR_spinner div with an icon that can be styled */}
        <IoReloadCircleSharp className="DYPR_spinner" size={ICON_SIZE_LOADING_ERROR} />
        <p className="DYPR_loading-text">Loading profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="DYPR_error-container">
        {/* Replaced ⚠️ with an icon */}
        <IoAlertCircleOutline className="DYPR_error-icon" size={ICON_SIZE_LOADING_ERROR} />
        <p className="DYPR_error-text">Error: {error}</p>
      </div>
    );
  }
  
  if (!profile) {
    return <div className="DYPR_not-found">No profile data available.</div>;
  }
  
  const { username, fullname, role, email, password, phone, photo_url, roll_number, institute_name, employee_id, managed_institutions } = profile;

  const getRoleIcon = (currentRole, size = ICON_SIZE_ROLE_EMOJI) => {
    const icons = {
      'SuperAdmin': <FaCrown size={size} />,
      'Admin': <FaCog size={size} />,
      'Teacher': <FaChalkboardTeacher size={size} />,
      'Student': <FaBook size={size} />,
    };
    return icons[currentRole] || <FaUser size={size} />;
  };

  const roleClass = `DYPR_role-${role.toLowerCase().replace(' ', '')}`;

  return (
    <div className="DYPR_page-container">
      <div className="DYPR_profile-container">
        {/* Hero Header */}
        <div className={`DYPR_hero-header ${roleClass}`}>
          <div className="DYPR_hero-content">
            <div className="DYPR_avatar-wrapper">
              <img src={photo_url} alt={`${fullname}'s Photo`} className="DYPR_avatar" />
              <div className={`DYPR_role-icon-badge ${roleClass}`}>
                <span className="DYPR_role-emoji">{getRoleIcon(role, ICON_SIZE_ROLE_EMOJI)}</span>
              </div>
            </div>
            <div className="DYPR_hero-text">
              <h1 className="DYPR_hero-name">{fullname}</h1>
              <p className="DYPR_hero-username">@{username}</p>
              <span className={`DYPR_role-badge ${roleClass}`}>
                {getRoleIcon(role, ICON_SIZE_ROLE_BADGE)} {role}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="DYPR_content-wrapper">
          {/* Personal Information Card */}
          <div className="DYPR_card">
            <div className="DYPR_card-header">
              <h2 className="DYPR_card-title">
                <FaUser size={ICON_SIZE_CARD_TITLE} style={{ marginRight: '8px' }}/> Personal Information
              </h2>
            </div>
            <div className="DYPR_card-body">
              <div className="DYPR_info-row">
                <div className="DYPR_info-icon"><FaUser size={ICON_SIZE_INFO_ROW} /></div>
                <div className="DYPR_info-content">
                  <span className="DYPR_info-label">Username</span>
                  <span className="DYPR_info-value">{username}</span>
                </div>
              </div>
              
              <div className="DYPR_info-row">
                <div className="DYPR_info-icon"><FaUser size={ICON_SIZE_INFO_ROW} /></div>
                <div className="DYPR_info-content">
                  <span className="DYPR_info-label">Full Name</span>
                  <span className="DYPR_info-value">{fullname}</span>
                </div>
              </div>

              {/* Student-specific fields */}
              {role === 'Student' && (
                <>
                  <div className="DYPR_info-row">
                    <div className="DYPR_info-icon"><FaBook size={ICON_SIZE_INFO_ROW} /></div>
                    <div className="DYPR_info-content">
                      <span className="DYPR_info-label">Roll Number</span>
                      <span className="DYPR_info-value">{roll_number}</span>
                    </div>
                  </div>
                  
                  <div className="DYPR_info-row">
                    <div className="DYPR_info-icon"><FaCog size={ICON_SIZE_INFO_ROW} /></div>
                    <div className="DYPR_info-content">
                      <span className="DYPR_info-label">Institute Name</span>
                      <span className="DYPR_info-value">{institute_name}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Admin-specific fields */}
              {role === 'Admin' && (
                <>
                  <div className="DYPR_info-row">
                    <div className="DYPR_info-icon"><FaCog size={ICON_SIZE_INFO_ROW} /></div>
                    <div className="DYPR_info-content">
                      <span className="DYPR_info-label">Employee ID</span>
                      <span className="DYPR_info-value">{employee_id}</span>
                    </div>
                  </div>
                  
                  <div className="DYPR_info-row">
                    <div className="DYPR_info-icon"><FaCog size={ICON_SIZE_INFO_ROW} /></div>
                    <div className="DYPR_info-content">
                      <span className="DYPR_info-label">Managed Institutes</span>
                      <span className="DYPR_info-value">{managed_institutions}</span>
                    </div>
                  </div>
                </>
              )}

              {/* SuperAdmin and Teacher-specific fields */}
              {(role === 'SuperAdmin' || role === 'Teacher') && (
                <div className="DYPR_info-row">
                  <div className="DYPR_info-icon"><FaCog size={ICON_SIZE_INFO_ROW} /></div>
                  <div className="DYPR_info-content">
                    <span className="DYPR_info-label">Employee ID</span>
                    <span className="DYPR_info-value">{employee_id}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information Card */}
          <div className="DYPR_card">
            <div className="DYPR_card-header">
              {/* Replaced 📇 with an icon */}
              <h2 className="DYPR_card-title">
                <FaHistory size={ICON_SIZE_CARD_TITLE} style={{ marginRight: '8px' }}/> Contact Information
              </h2>
            </div>
            <div className="DYPR_card-body">
              <div className="DYPR_info-row">
                {/* Replaced 📧 with an icon */}
                <div className="DYPR_info-icon"><FaEnvelope size={ICON_SIZE_INFO_ROW} /></div>
                <div className="DYPR_info-content">
                  <span className="DYPR_info-label">Email Address</span>
                  <span className="DYPR_info-value">{email}</span>
                </div>
              </div>
              
              <div className="DYPR_info-row">
                {/* Replaced 📞 with an icon */}
                <div className="DYPR_info-icon"><FaPhoneAlt size={ICON_SIZE_INFO_ROW} /></div>
                <div className="DYPR_info-content">
                  <span className="DYPR_info-label">Phone Number</span>
                  <span className="DYPR_info-value">{phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="DYPR_card DYPR_card-full">
            
            <div className="DYPR_card-body">
              <div className="DYPR_password-container">
                <div className="DYPR_password-label">
                  {/* Replaced 🔒 with an icon */}
                  <span className="DYPR_lock-icon"><FaLock size={20} /></span>
                  <span>Password</span>
                </div>
                <div className="DYPR_password-input-group">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    readOnly
                    className="DYPR_password-input"
                  />
                  <button 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="DYPR_password-toggle btn btn-outline btn-sm"
                  >
                    {/* Replaced 🙈 Hide : 👁️ Show with icons */}
                    {showPassword 
                      ? <><FaEyeSlash size={14} style={{ marginRight: '4px' }}/> Hide</> 
                      : <><FaEye size={14} style={{ marginRight: '4px' }}/> Show</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicProfile;