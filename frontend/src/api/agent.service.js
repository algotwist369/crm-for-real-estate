import axiosInstance from './axiosInstance';

const agentService = {
   
  createAgent: async (agentData) => {
    const response = await axiosInstance.post('/admin/agents', agentData);
    return response.data;
  },

  
  getAgents: async () => {
    const response = await axiosInstance.get('/admin/agents');
    return response.data;
  },

 
  updateAgentProfile: async (id, updateData) => {
    const response = await axiosInstance.patch(`/admin/agents/${id}`, updateData);
    return response.data;
  },

  updateAgentStatus: async (id, updateData) => {
    const response = await axiosInstance.patch(`/admin/agents/${id}/status`, updateData);
    return response.data;
  },

 
  deleteAgent: async (id) => {
    const response = await axiosInstance.delete(`/admin/agents/${id}`);
    return response.data;
  },

  remarkAgent: async (id, remark) => {
    const response = await axiosInstance.post(`/admin/agents/${id}/remark`, { remark });
    return response.data;
  }
};

export default agentService;
