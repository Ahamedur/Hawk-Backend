module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        first_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        dob: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    return User;
};
