import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';
import { ONES } from '@ones-open/sdk'
import { Table } from "@ones-design/table";
import { Select, ConfigProvider } from '@ones-design/core'
import { useMemoizedFn } from "ahooks";


const SettingPage1App = () => {

    const [token, setToken] = useState("");
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [teamUsers, setTeamUsers] = useState([]);
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        fetchTeams();
    }, []);


    const fetchTeams = useMemoizedFn(async () => {
        setLoading(true);
        const res = await ONES.fetchOpenAPI("/v2/account/teams", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await res.json();

        const teams = data?.data?.teams || [];
        console.log(teams);
        teams.forEach((team) => {
            team.createdAt = new Date(team.createTime/1000).toLocaleString("zh-CN", {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        });
        setTeams(teams);
        setLoading(false);
    })

    const onTeamSelect = useMemoizedFn(async (value, opt) => {
        fetchTeamUsers(value);
        fetchProjects(value);
    })

    const fetchTeamUsers = useMemoizedFn(async (value) => {
        const res = await ONES.fetchOpenAPI(`/v2/account/users/search?teamID=${value}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await res.json();
        const users = data?.data?.list || [];
        setTeamUsers(users);
    })

    const fetchProjects = useMemoizedFn(async (value) => {
        const res = await ONES.fetchOpenAPI(`/v2/project/projects?teamID=${value}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await res.json();
        const projects = data?.data?.list || [];
        projects.forEach((project) => {
            project.createdAt = new Date(project.createTime/1000).toLocaleString("zh-CN", {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
            });
        });
        setProjects(projects);
    })

    return (
        <div>
            <h1>Teams</h1>
            <button onClick={fetchTeams}>Refresh Teams</button>
            {/* @ts-expect-error - Table component type mismatch between React 17 and React 19 types */}
            <Table
                columns={[
                    {
                        dataIndex: 'id',
                        lock: true,
                        width: 80,
                        title:'团队UUID'
                    },
                    {
                        dataIndex: 'name',
                        title: '团队名称',
                        width: 80,
                    },
                    {
                        dataIndex: 'createdAt',
                        title: '创建日期',
                        width: 150
                    },
                    {
                        dataIndex: 'owner',
                        title: '团队负责人',
                        width: 150,
                    },
                ]}
                dataSource={teams}
            />
            <h2>Select a team</h2>
            <Select options={teams.map((team) => ({
                label: team.name,
                value: team.id
            }))} onChange={onTeamSelect} onSelect={function Ua() {}}/>
            {/* @ts-expect-error - Table component type mismatch between React 17 and React 19 types */}
            <Table
                columns={[
                    {
                        dataIndex: 'id',
                        lock: true,
                        width: 80,
                        title:'用户UUID'
                    },
                    {
                        dataIndex: 'name',
                        title: '用户名称',
                        width: 80,
                    },
                    {
                        dataIndex: 'email',
                        title: '邮箱',
                        width: 150,
                    },
                ]}
                dataSource={teamUsers}
            />
            <h2>Projects</h2>
            {/* @ts-expect-error - Table component type mismatch between React 17 and React 19 types */}
            <Table
                columns={[
                    {
                        dataIndex: 'id',
                        width: 80,
                        title: '项目UUID'
                    },
                    {
                        dataIndex: 'name',
                        title: '项目名称'
                    },
                    {
                        dataIndex: 'createdAt',
                        title: '创建时间',
                        width: 150
                    }
                ]}
                dataSource={projects}
            />
        </div>
    )
}

ReactDOM.render(
    <ConfigProvider>
      <SettingPage1App />
    </ConfigProvider>,
    document.getElementById('app')
  );