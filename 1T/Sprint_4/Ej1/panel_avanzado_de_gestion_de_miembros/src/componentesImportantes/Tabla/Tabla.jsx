import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Tabla.css';
import FilterBar from './FilterBar/FilterBar'; // Asegúrate de ajustar la ruta según tu estructura de archivos
import addMember from '../../Services/addMember';
import updateMember from '../../Services/updateMember';
import deleteMember from '../../Services/deleteMember';

const Tabla = () => {
  const [guildMembers, setGuildMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [filters, setFilters] = useState({
    characterRole: '',
    guildRole: '',
    mainArchetype: '',
    secondaryArchetype: '',
    grandmasterProfessions: '',
    minLevel: '',
    maxLevel: '',
    minItemLevel: '',
    maxItemLevel: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });

  useEffect(() => {
    const fetchGuildMembers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/guildmembers'); // Reemplaza con la URL de tu API
        setGuildMembers(response.data);
      } catch (error) {
        console.error('Error fetching guild members:', error);
      }
    };

    fetchGuildMembers();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filteredData = guildMembers.filter(item => {
    return (
      (!filters.characterRole || item.character_role.includes(filters.characterRole)) &&
      (!filters.guildRole || item.guild_role.includes(filters.guildRole)) &&
      (!filters.mainArchetype || item.main_archetype.includes(filters.mainArchetype)) &&
      (!filters.secondaryArchetype || item.secondary_archetype.includes(filters.secondaryArchetype)) &&
      (!filters.grandmasterProfessions || item.grandmaster_profession_one.includes(filters.grandmasterProfessions) || item.grandmaster_profession_two.includes(filters.grandmasterProfessions)) &&
      (!filters.minLevel || item.level >= filters.minLevel) &&
      (!filters.maxLevel || item.level <= filters.maxLevel) &&
      (!filters.minItemLevel || item.ilvl >= filters.minItemLevel) &&
      (!filters.maxItemLevel || item.ilvl <= filters.maxItemLevel)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const handleSelectMember = (userId) => {
    setSelectedMembers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleAddMember = () => {
    setEditingMember({
      user_id: '',
      username: '',
      email: '',
      level: '',
      ilvl: '',
      character_role: '',
      guild_role: '',
      main_archetype: '',
      secondary_archetype: '',
      grandmaster_profession_one: '',
      grandmaster_profession_two: '',
      notify_email: true,
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleDeleteMember = async (userId) => {
    try {
      await deleteMember(userId);
      setGuildMembers((prevMembers) =>
        prevMembers.filter((member) => member.user_id !== userId)
      );
    } catch (error) {
      console.error('Error deleting guild member:', error);
    }
  };

  const handleSaveChanges = async () => {
    if (!editingMember.email.includes('@')) {
      setErrorMessage('Email must contain @');
      return;
    }

    try {
      if (isEditing) {
        await updateMember(editingMember.user_id, editingMember);
        setGuildMembers((prevMembers) =>
          prevMembers.map((member) =>
            member.user_id === editingMember.user_id ? editingMember : member
          )
        );
      } else {
        await addMember(editingMember);
        setGuildMembers((prevMembers) => [...prevMembers, editingMember]);
      }
      setShowModal(false);
      setErrorMessage('');
    } catch (error) {
      console.error('Error saving guild member:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditingMember((prevMember) => ({
      ...prevMember,
      [name]: value,
    }));
  };

  return (
    <div className="table-container">
      <h1>Guild Members</h1>
      <button className="add-button" onClick={handleAddMember}>Add Member</button>
      <FilterBar filters={filters} onFilterChange={handleFilterChange} onSort={handleSort} />
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>user_id</th>
            <th>username</th>
            <th>level</th>
            <th>ilvl</th>
            <th>character_role</th>
            <th>guild_role</th>
            <th>main_archetype</th>
            <th>secondary_archetype</th>
            <th>grandmaster_profession_one</th>
            <th>grandmaster_profession_two</th>
            <th>email</th>
            <th>notify_email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((member) => (
            <tr key={member.user_id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.user_id)}
                  onChange={() => handleSelectMember(member.user_id)}
                />
              </td>
              <td>{member.user_id}</td>
              <td>{member.username}</td>
              <td>{member.level}</td>
              <td>{member.ilvl}</td>
              <td>{member.character_role}</td>
              <td>{member.guild_role}</td>
              <td>{member.main_archetype}</td>
              <td>{member.secondary_archetype}</td>
              <td>{member.grandmaster_profession_one}</td>
              <td>{member.grandmaster_profession_two}</td>
              <td>{member.email}</td>
              <td>{member.notify_email ? 'Yes' : 'No'}</td>
              <td>
                <button className="edit" onClick={() => handleEditMember(member)}>Edit</button>
                <button className="delete" onClick={() => handleDeleteMember(member.user_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
            <h2>{isEditing ? 'Edit Member' : 'Add Member'}</h2>
            <form>
              <label>
                User Id: 
                <input type="text" name="user_id" value={editingMember.user_id} onChange={handleChange} />
              </label>
              <label>
                Username:
                <input type="text" name="username" value={editingMember.username} onChange={handleChange} />
              </label>
              <label>
                Email:
                <input type="email" name="email" value={editingMember.email} onChange={handleChange} />
              </label>
              <label>
                Level:
                <input type="number" name="level" value={editingMember.level} onChange={handleChange} />
              </label>
              <label>
                Item Level:
                <input type="number" name="ilvl" value={editingMember.ilvl} onChange={handleChange} />
              </label>
              <label>
                Character Role:
                <select name="character_role" value={editingMember.character_role} onChange={handleChange}>
                  <option value="TANK">TANK</option>
                  <option value="HEALER">HEALER</option>
                  <option value="DAMAGE">DAMAGE</option>
                  <option value="SUPPORT">SUPPORT</option>
                </select>
              </label>
              <label>
                Guild Role:
                <select name="guild_role" value={editingMember.guild_role} onChange={handleChange}>
                  <option value="LIDER">LIDER</option>
                  <option value="GERENTE SENIOR">GERENTE SENIOR</option>
                  <option value="GERENTE">GERENTE</option>
                  <option value="GERENTE A2">GERENTE A2</option>
                  <option value="ALPHA 2">ALPHA 2</option>
                  <option value="MEMBER">MEMBER</option>
                </select>
              </label>
              <label>
                Main Archetype:
                <select name="main_archetype" value={editingMember.main_archetype} onChange={handleChange}>
                  <option value="BARD">BARD</option>
                  <option value="CLERIC">CLERIC</option>
                  <option value="FIGHTER">FIGHTER</option>
                  <option value="MAGE">MAGE</option>
                  <option value="RANGER">RANGER</option>
                  <option value="ROGUE">ROGUE</option>
                  <option value="SUMMONER">SUMMONER</option>
                  <option value="TANK">TANK</option>
                </select>
              </label>
              <label>
                Secondary Archetype:
                <select name="secondary_archetype" value={editingMember.secondary_archetype} onChange={handleChange}>
                  <option value="BARD">BARD</option>
                  <option value="CLERIC">CLERIC</option>
                  <option value="FIGHTER">FIGHTER</option>
                  <option value="MAGE">MAGE</option>
                  <option value="RANGER">RANGER</option>
                  <option value="ROGUE">ROGUE</option>
                  <option value="SUMMONER">SUMMONER</option>
                  <option value="TANK">TANK</option>
                </select>
              </label>
              <label>
                Grandmaster Profession One:
                <select name="grandmaster_profession_one" value={editingMember.grandmaster_profession_one} onChange={handleChange}>
                  <option value="FISHING">FISHING</option>
                  <option value="HERBALISM">HERBALISM</option>
                  <option value="HUNTING">HUNTING</option>
                  <option value="LUMBERJACKING">LUMBERJACKING</option>
                  <option value="MINING">MINING</option>
                  <option value="ALCHEMY">ALCHEMY</option>
                  <option value="ANIMALHUSBANDRY">ANIMALHUSBANDRY</option>
                  <option value="COOKING">COOKING</option>
                  <option value="FARMING">FARMING</option>
                  <option value="LUMBERMILLING">LUMBERMILLING</option>
                  <option value="METALWORKING">METALWORKING</option>
                  <option value="STONECUTTING">STONECUTTING</option>
                  <option value="TANNING">TANNING</option>
                  <option value="WEAVING">WEAVING</option>
                  <option value="ARCANEENGINEERING">ARCANEENGINEERING</option>
                  <option value="ARMORSMITHING">ARMORSMITHING</option>
                  <option value="CARPENTRY">CARPENTRY</option>
                  <option value="JEWELCUTTING">JEWELCUTTING</option>
                  <option value="LEATHERWORKING">LEATHERWORKING</option>
                  <option value="SCRIBE">SCRIBE</option>
                  <option value="TAILORING">TAILORING</option>
                  <option value="WEAPONSMITHING">WEAPONSMITHING</option>
                </select>
              </label>
              <label>
                Grandmaster Profession Two:
                <select name="grandmaster_profession_two" value={editingMember.grandmaster_profession_two} onChange={handleChange}>
                  <option value="FISHING">FISHING</option>
                  <option value="HERBALISM">HERBALISM</option>
                  <option value="HUNTING">HUNTING</option>
                  <option value="LUMBERJACKING">LUMBERJACKING</option>
                  <option value="MINING">MINING</option>
                  <option value="ALCHEMY">ALCHEMY</option>
                  <option value="ANIMALHUSBANDRY">ANIMALHUSBANDRY</option>
                  <option value="COOKING">COOKING</option>
                  <option value="FARMING">FARMING</option>
                  <option value="LUMBERMILLING">LUMBERMILLING</option>
                  <option value="METALWORKING">METALWORKING</option>
                  <option value="STONECUTTING">STONECUTTING</option>
                  <option value="TANNING">TANNING</option>
                  <option value="WEAVING">WEAVING</option>
                  <option value="ARCANEENGINEERING">ARCANEENGINEERING</option>
                  <option value="ARMORSMITHING">ARMORSMITHING</option>
                  <option value="CARPENTRY">CARPENTRY</option>
                  <option value="JEWELCUTTING">JEWELCUTTING</option>
                  <option value="LEATHERWORKING">LEATHERWORKING</option>
                  <option value="SCRIBE">SCRIBE</option>
                  <option value="TAILORING">TAILORING</option>
                  <option value="WEAPONSMITHING">WEAPONSMITHING</option>
                </select>
              </label>
              {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
              <button type="button" className="save-button" onClick={handleSaveChanges}>Save Changes</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tabla;
