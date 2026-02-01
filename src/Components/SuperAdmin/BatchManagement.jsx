import '../../Styles/SuperAdmin/BatchManagement.css';
import '../../Styles/SuperAdmin/UserManagement.css';
import React, { useState, useEffect, useMemo } from 'react';
import CardSlider from '../Reusable/CardSlider';
import { FaPlusCircle, FaBookOpen, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { getAllInstitutions } from '../../api/institutionsApi';
import { getAllCourses } from '../../api/coursesApi';
import { getLevelsByCourse } from '../../api/levelsApi';
import { getProgrammesByCourseLevel } from '../../api/programmesApi';
import { getAllBatches, updateBatch } from '../../api/batchesApi';

const BatchCard = ({ batch, isSelected, onClick }) => (
  <div className={`batch_batch-card ${isSelected ? 'selected' : ''} flex-center`} onClick={onClick}>
    <FaCalendarAlt size={20} />
    <span className="batch_batch-year-text">{batch.batch_name || 'Batch'}</span>
  </div>
);

const BatchManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [batches, setBatches] = useState([]);
  const [activeInstitutionId, setActiveInstitutionId] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeLevel, setActiveLevel] = useState(null);
  const [activeProgrammeId, setActiveProgrammeId] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [editBatchForm, setEditBatchForm] = useState({ open: false, data: null });

  // Fetch data
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: insts } = await getAllInstitutions();
      setInstitutions(insts || []);
      const { data: crs } = await getAllCourses();
      setCourses(crs || []);
      const { data: bts } = await getAllBatches();
      setBatches(bts || []);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!activeCourseId) { setLevels([]); return; }
    (async () => {
      setLoading(true);
      const { data } = await getLevelsByCourse(activeCourseId);
      setLevels(data || []);
      setLoading(false);
    })();
  }, [activeCourseId]);

  useEffect(() => {
    if (!activeCourseId || !activeLevel) { setProgrammes([]); return; }
    (async () => {
      setLoading(true);
      const { data } = await getProgrammesByCourseLevel(activeCourseId, activeLevel.id);
      setProgrammes(data || []);
      setLoading(false);
    })();
  }, [activeCourseId, activeLevel]);

  const institutionsForSlider = useMemo(() => new Map(institutions.map(inst => [inst.id, { name: inst.institute_name, image: inst.photo || inst.profilePhoto || '' }])), [institutions]);
  const filteredBatches = useMemo(() => batches.filter(batch => !activeProgrammeId || batch.programme_id === activeProgrammeId), [batches, activeProgrammeId]);

  // Handlers
  const handleInstitutionSelect = (id) => { setActiveInstitutionId(id); setActiveCourseId(null); setActiveLevel(null); setActiveProgrammeId(null); setSelectedBatch(null); };
  const handleCourseSelect = (id) => { setActiveCourseId(id); setActiveLevel(null); setActiveProgrammeId(null); setSelectedBatch(null); };
  const handleLevelSelect = (level) => { setActiveLevel(level); setActiveProgrammeId(null); setSelectedBatch(null); };
  const handleProgrammeSelect = (id) => { setActiveProgrammeId(id); setSelectedBatch(null); };
  const handleBatchSelect = (batch) => { setSelectedBatch(batch); };
  const handleEditBatchClick = () => { setEditBatchForm({ open: true, data: selectedBatch }); };
  const handleEditBatchChange = (e) => { const { name, value } = e.target; setEditBatchForm(prev => ({ ...prev, data: { ...prev.data, [name]: value } })); };
  const handleEditBatchSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Only send editable fields to updateBatch
      const { id, batch_name, start_date, end_date, status, description, notes } = editBatchForm.data;
      const updatePayload = { batch_name, start_date, end_date, status, description, notes };
      const { data, error } = await updateBatch(id, updatePayload);
      console.log('updateBatch response:', { data, error });
      if (error) throw error;
      setBatches(prev => prev.map(b => b.id === data.id ? data : b));
      setSelectedBatch(data);
      setEditBatchForm({ open: false, data: null });
      alert('Batch updated successfully!');
    } catch (error) {
      alert('Error updating batch: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="batch_management slide-down">
      <div className="batch_um-header">
        <h2 className="page-title text-3xl font-bold">Batch Management</h2>
        <div className="batch_um-actions">
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <FaPlusCircle size={18} />
            <span>{showForm ? 'Close Form' : 'Create Batch'}</span>
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <p className="text-lg text-gray-600">Loading data...</p>
        </div>
      ) : (
        <>
          <div className="batch_card-section">
            <CardSlider title="Institutions" institutes={institutionsForSlider} onSelectInstitute={handleInstitutionSelect} icon_title="Institutions" searchBar={false} />
            {activeInstitutionId && (
              <div className="batch_card-section">
                <h3 className="batch_section-title text-xl font-semibold">Select Course</h3>
                <div className="batch_master-course-selection">
                  {courses.map(course => (
                    <div key={course.id} className={`batch_course-card ${activeCourseId === course.id ? 'selected' : ''}`} onClick={() => handleCourseSelect(course.id)}>
                      <FaBookOpen size={24} className="mb-2" />
                      {course.course_name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {activeCourseId && (
            <div className="batch_card-section">
              <h3 className="batch_section-title text-xl font-semibold">Select Level</h3>
              {levels.length > 0 ? (
                <div className="batch_program-selection-grid">
                  {levels.map(level => (
                    <div key={level.id} className={`batch_program-card ${activeLevel?.id === level.id ? 'selected' : ''}`} onClick={() => handleLevelSelect(level)}>
                      <FaMapMarkerAlt size={24} className="text-brand-orange-dark" />
                      <span className="font-semibold">{level.level_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="batch_empty-state">No levels available for this course.</p>
              )}
            </div>
          )}
          {activeLevel && (
            <div className="batch_card-section">
              <h3 className="batch_section-title text-xl font-semibold">Select Programme</h3>
              {programmes.length > 0 ? (
                <div className="batch_program-selection-grid">
                  {programmes.map(programme => (
                    <div key={programme.id} className={`batch_program-card ${activeProgrammeId === programme.id ? 'selected' : ''}`} onClick={() => handleProgrammeSelect(programme.id)}>
                      <FaBookOpen size={24} className="text-brand-orange-dark" />
                      <span className="font-semibold">{programme.programme_name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="batch_empty-state">No programmes available for this level.</p>
              )}
            </div>
          )}
          {activeProgrammeId && (
            <div className="batch_card-section">
              <h3 className="batch_section-title text-xl font-semibold">Batches</h3>
              {filteredBatches.length > 0 ? (
                <div className="batch_program-selection-grid">
                  {filteredBatches.map(batch => (
                    <BatchCard key={batch.id} batch={batch} isSelected={selectedBatch?.id === batch.id} onClick={() => handleBatchSelect(batch)} />
                  ))}
                </div>
              ) : (
                <p className="batch_empty-state">No batches available for this programme.</p>
              )}
            </div>
          )}
          {selectedBatch && (
            <div className="batch_card-section">
              <h3 className="batch_section-title text-xl font-semibold">Batch Details</h3>
              <div className="p-6 bg-white rounded-lg shadow">
                {editBatchForm.open ? (
                  <form onSubmit={handleEditBatchSubmit} className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Batch Name</p>
                      <input type="text" name="batch_name" value={editBatchForm.data.batch_name || ''} onChange={handleEditBatchChange} className="input-text" required />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <input type="date" name="start_date" value={editBatchForm.data.start_date || ''} onChange={handleEditBatchChange} className="input-text" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">End Date</p>
                      <input type="date" name="end_date" value={editBatchForm.data.end_date || ''} onChange={handleEditBatchChange} className="input-text" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <select name="status" value={editBatchForm.data.status || 'Active'} onChange={handleEditBatchChange} className="input-select">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Description</p>
                      <textarea
                        name="description"
                        value={editBatchForm.data.description || ''}
                        onChange={handleEditBatchChange}
                        className="input-text"
                        rows={2}
                      />
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Notes</p>
                      <textarea
                        name="notes"
                        value={editBatchForm.data.notes || ''}
                        onChange={handleEditBatchChange}
                        className="input-text"
                        rows={2}
                      />
                    </div>
                    <div className="col-span-2 flex gap-2 mt-4">
                      <button type="submit" className="btn btn-primary">Save</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditBatchForm({ open: false, data: null })}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Batch Name</p>
                        <p className="font-semibold">{selectedBatch.batch_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Start Date</p>
                        <p className="font-semibold">{selectedBatch.start_date || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">End Date</p>
                        <p className="font-semibold">{selectedBatch.end_date || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-semibold">{selectedBatch.status || 'Active'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Description</p>
                        <p className="font-semibold">{selectedBatch.description || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="font-semibold">{selectedBatch.notes || 'N/A'}</p>
                      </div>
                    </div>
                    <button className="btn btn-primary mt-4" onClick={handleEditBatchClick}>Edit</button>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BatchManagement;