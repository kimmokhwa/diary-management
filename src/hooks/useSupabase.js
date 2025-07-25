import { supabase } from '../services/supabase';

export const useSupabase = (table) => {
  // CREATE
  const create = async (data) => {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    if (error) throw error;
    return result[0];
  };

  // READ
  const read = async (filter = {}) => {
    let query = supabase.from(table).select('*');
    Object.entries(filter).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    const { data, error } = await query;
    if (error) throw error;
    return data;
  };

  // UPDATE
  const update = async (id, data) => {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select();
    if (error) throw error;
    return result[0];
  };

  // DELETE
  const remove = async (id) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    if (error) throw error;
  };

  return { create, read, update, remove };
}; 