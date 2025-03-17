1. UTILIZATION RATE
SQL FUNCTION FOR “UTILIZATION RATE”

CREATE OR REPLACE FUNCTION calculate_utilization_rate(input_full_name text)
RETURNS TABLE (
  total_open_tasks BIGINT,
  stale_tasks BIGINT,
  utilization_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH open_tasks AS (
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (
        WHERE to_timestamp((data->>'last_updated_time_long')::BIGINT / 1000) < NOW() - INTERVAL '24 HOURS'
      ) AS stale
    FROM public.raw_zoho_data
    WHERE 
      entity_type = 'tasks'
      AND (data->'status'->>'type') NOT IN ('closed', 'completed', 'cancelled')
      AND (data->'details'->'owners'->0->>'full_name') = input_full_name
  )
  SELECT
    ot.total,
    ot.stale,
    CASE 
      WHEN ot.total = 0 THEN 0 
      ELSE ROUND((ot.total - ot.stale)::NUMERIC / ot.total, 4) 
    END AS rate
  FROM open_tasks ot;
END;
$$ LANGUAGE plpgsql;



Sample Calculation
SELECT 
  total_open_tasks,
  stale_tasks,
  utilization_rate AS decimal_rate,
  ROUND(utilization_rate * 100, 2) AS percentage_rate
FROM calculate_utilization_rate('Harsha');



2. Task Timeliness
SQL FUNCTION FOR “TASK TIMELINESS”

-- First drop any existing functions
DROP FUNCTION IF EXISTS calculate_task_timeliness_users(text);

-- Then create the new function with the new name
CREATE OR REPLACE FUNCTION calculate_task_timeliness_users(input_full_name text)
RETURNS TABLE (
  total_tasks BIGINT,
  on_time_tasks BIGINT,
  timeliness_rate text
) AS $$
BEGIN
  RETURN QUERY
  WITH task_data AS (
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (
        WHERE 
          (data->>'completed')::BOOLEAN = TRUE
          AND to_timestamp((data->>'completed_time_long')::BIGINT / 1000) 
            <= to_timestamp((data->>'end_date_long')::BIGINT / 1000)
      ) AS on_time
    FROM public.raw_zoho_data
    WHERE 
      entity_type = 'tasks'
      AND (data->'details'->'owners'->0->>'full_name') = input_full_name
  )
  SELECT
    td.total,
    td.on_time,
    CASE 
      WHEN td.total = 0 THEN '0'
      ELSE ROUND((td.on_time::NUMERIC / td.total * 100), 2)::text
    END
  FROM task_data td;
END;
$$ LANGUAGE plpgsql;




How to calculate Example:
SELECT * FROM calculate_task_timeliness_users('Pavan Reddy');





3. Avg Completion Rate

Function:
CREATE OR REPLACE FUNCTION calculate_avg_completion_time(input_full_name text)
RETURNS TABLE (
  total_completed_tasks BIGINT,
  avg_completion_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH task_data AS (
    SELECT 
      to_timestamp((data->>'completed_time_long')::BIGINT / 1000) AS completed_time,
      to_timestamp((data->>'created_time_long')::BIGINT / 1000) AS created_time
    FROM public.raw_zoho_data
    WHERE 
      entity_type = 'tasks'
      AND (data->>'completed')::BOOLEAN
      AND (data->'details'->'owners'->0->>'full_name') = input_full_name
  )
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(
      AVG(
        EXTRACT(EPOCH FROM (completed_time - created_time)) / 86400
      )::NUMERIC, 
      0.00
    )
  FROM task_data;
END;
$$ LANGUAGE plpgsql;


Example fetch:
SELECT
  total_completed_tasks,
  avg_completion_time AS avg_days,
  ROUND(avg_completion_time::NUMERIC, 2) AS rounded_days
FROM calculate_avg_completion_time('Pavan Reddy');



4. Task Aging Days

Function:
CREATE OR REPLACE FUNCTION calculate_pending_tasks_aging(input_full_name text)
RETURNS TABLE (
  total_overdue_tasks BIGINT,
  avg_days_overdue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH overdue_tasks AS (
    SELECT
      (NOW() - to_timestamp((data->>'end_date_long')::BIGINT / 1000)) AS overdue_interval
    FROM public.raw_zoho_data
    WHERE 
      entity_type = 'tasks'
      AND (data->'status'->>'type') NOT IN ('closed', 'completed', 'cancelled')
      AND (data->'details'->'owners'->0->>'full_name') = input_full_name
      AND to_timestamp((data->>'end_date_long')::BIGINT / 1000) < NOW()
  )
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(AVG(
      EXTRACT(EPOCH FROM overdue_interval) / 86400
    )::NUMERIC, 0.00)
  FROM overdue_tasks;
END;
$$ LANGUAGE plpgsql;



Example Fetch:
SELECT * FROM calculate_pending_tasks_aging('seshu Mudumba');




___________________FOR PROJECTS_____________________________


1. Unplanned Days %

FUnction:


-- Then create the new function with consistent types
CREATE OR REPLACE FUNCTION calculate_project_unplanned_percentage(p_project_id varchar)
RETURNS TABLE (
    project_id varchar,
    project_name varchar,
    project_start_date date,
    project_end_date date,
    last_milestone_date date,
    milestone_names varchar[],
    milestone_end_dates varchar[],
    total_project_days integer,
    unplanned_days integer,
    unplanned_percentage decimal
) AS $$
BEGIN
    RETURN QUERY
    WITH project_milestones AS (
        SELECT
            p.entity_id::varchar,
            p.data->>'name' as name,
            (p.data->>'start_date')::date as start_date,
            (p.data->>'end_date')::date as end_date,
            ARRAY_AGG(m.data->>'name' ORDER BY (m.data->>'end_date')::date DESC) FILTER (WHERE m.data->>'name' IS NOT NULL) as milestone_names,
            ARRAY_AGG(m.data->>'end_date' ORDER BY (m.data->>'end_date')::date DESC) FILTER (WHERE m.data->>'name' IS NOT NULL) as milestone_dates,
            MAX((m.data->>'end_date')::date) as last_milestone
        FROM raw_zoho_data p
        LEFT JOIN raw_zoho_data m ON
            m.entity_type = 'milestones'
            AND m.data->'project'->>'id' = p.data->>'id_string'
        WHERE p.entity_type = 'projects'
        AND p.entity_id = p_project_id
        GROUP BY
            p.entity_id,
            p.data->>'name',
            p.data->>'start_date',
            p.data->>'end_date'
    )
    SELECT
        pm.entity_id::varchar,
        pm.name::varchar,
        pm.start_date,
        pm.end_date,
        pm.last_milestone,
        pm.milestone_names::varchar[],
        pm.milestone_dates::varchar[],
        (pm.end_date - pm.start_date)::integer as total_days,
        CASE
            WHEN pm.last_milestone IS NOT NULL THEN
                (pm.end_date - pm.last_milestone)::integer
            ELSE NULL
        END as unplanned_days,
        CASE
            WHEN pm.last_milestone IS NOT NULL THEN
                ROUND(
                    ((pm.end_date - pm.last_milestone)::decimal /
                    NULLIF((pm.end_date - pm.start_date)::decimal, 0) * 100)::decimal,
                    2
                )
            ELSE NULL
        END as unplanned_pct
    FROM project_milestones pm;
END;
$$ LANGUAGE plpgsql;

Fetch Example:

-- Now test the function
SELECT * FROM calculate_project_unplanned_percentage('134658000000512239');



2. Task Timeliness %



Function:
-- First, drop the existing functions to avoid conflicts
DROP FUNCTION IF EXISTS calculate_task_timeliness(text);
DROP FUNCTION IF EXISTS calculate_task_timeliness(text, date, date, text);

-- Create a single function with clear parameter types
CREATE OR REPLACE FUNCTION calculate_task_timeliness(
    project_id text DEFAULT NULL,
    start_date date DEFAULT NULL,
    end_date date DEFAULT NULL,
    task_status text DEFAULT 'Closed'
)
RETURNS TABLE (
    total_tasks bigint,
    on_time_tasks bigint,
    timeliness_rate text
) AS $$
BEGIN
    RETURN QUERY
    WITH task_details AS (
        SELECT 
            data->>'name' as task_name,
            data->'status'->>'name' as status,
            data->>'completed_time' as completion_date,
            data->>'end_date' as due_date,
            TO_DATE(data->>'completed_time', 'MM-DD-YYYY') as parsed_completion_date,
            TO_DATE(data->>'end_date', 'MM-DD-YYYY') as parsed_due_date,
            data->'link'->'self'->>'url' as task_url
        FROM raw_zoho_data
        WHERE 
            entity_type = 'tasks'
            AND (
                -- Apply project filter only if project_id is provided
                project_id IS NULL 
                OR data->'link'->'self'->>'url' LIKE '%/projects/' || project_id || '/tasks/%'
            )
            AND (
                -- Apply date range filters only if provided
                (start_date IS NULL OR TO_DATE(data->>'completed_time', 'MM-DD-YYYY') >= start_date)
                AND (end_date IS NULL OR TO_DATE(data->>'completed_time', 'MM-DD-YYYY') <= end_date)
            )
    ),
    task_counts AS (
        SELECT 
            COUNT(*) as all_tasks,
            COUNT(*) FILTER (WHERE status = task_status) as filtered_tasks,
            COUNT(*) FILTER (
                WHERE status = task_status
                AND parsed_completion_date <= parsed_due_date
            ) as completed_on_time
        FROM task_details
    )
    SELECT 
        filtered_tasks as total_tasks,
        completed_on_time as on_time_tasks,
        CASE 
            WHEN filtered_tasks > 0 THEN 
                ROUND((completed_on_time::decimal / filtered_tasks::decimal * 100)::decimal, 2)::text
            ELSE '0'
        END as timeliness_rate
    FROM task_counts;
END;
$$ LANGUAGE plpgsql;



Fetch using:
SELECT * FROM calculate_task_timeliness(project_id := '134658000000512239');

3. Open Tasks Aging %

Function:


DROP FUNCTION IF EXISTS calculate_open_tasks_aging(varchar);

CREATE OR REPLACE FUNCTION calculate_open_tasks_aging(p_project_id varchar)
RETURNS TABLE (
    total_overdue_tasks integer,
    total_overdue_days integer,
    average_aging text
) AS $$
BEGIN
    RETURN QUERY
    WITH overdue_tasks AS (
        SELECT 
            CURRENT_DATE - TO_DATE(data->>'end_date', 'MM-DD-YYYY') as days_overdue
        FROM raw_zoho_data
        WHERE 
            entity_type = 'tasks'
            AND data->'link'->'self'->>'url' LIKE '%/projects/' || p_project_id || '/tasks/%'
            AND (
                data->'status'->>'name' = 'Open' 
                OR data->'status'->>'name' = 'In Progress'
            )
            AND TO_DATE(data->>'end_date', 'MM-DD-YYYY') < CURRENT_DATE
    )
    SELECT 
        COUNT(*)::integer,
        SUM(days_overdue)::integer,
        ROUND(AVG(days_overdue)::decimal, 2)::text
    FROM overdue_tasks;
END;
$$ LANGUAGE plpgsql;

Fetch Usng:
SELECT * FROM calculate_open_tasks_aging('134658000000783005');


4. Backlog rate %

Function:

DROP FUNCTION IF EXISTS calculate_rotten_tasks(varchar);

CREATE OR REPLACE FUNCTION calculate_rotten_tasks(p_project_id varchar)
RETURNS TABLE (
    total_open_tasks integer,
    rotten_tasks integer,
    rotten_percentage text
) AS $$
BEGIN
    RETURN QUERY
    WITH task_metrics AS (
        SELECT 
            COUNT(*) as total_open,
            COUNT(*) FILTER (
                WHERE TO_DATE(data->>'last_updated_time', 'MM-DD-YYYY') < (CURRENT_DATE - interval '7 days')::date
            ) as rotten_count
        FROM raw_zoho_data
        WHERE 
            entity_type = 'tasks'
            AND data->'link'->'self'->>'url' LIKE '%/projects/' || p_project_id || '/tasks/%'
            AND (
                data->'status'->>'name' = 'Open' 
                OR data->'status'->>'name' = 'In Progress'
            )
    )
    SELECT 
        total_open::integer,
        rotten_count::integer,
        CASE 
            WHEN total_open > 0 THEN
                ROUND((rotten_count::decimal / total_open::decimal * 100)::decimal, 2)::text
            ELSE '0'
        END
    FROM task_metrics;
END;
$$ LANGUAGE plpgsql;



Fetch Example:
SELECT * FROM calculate_rotten_tasks('134658000000512239');

